"""Fetch every indicator used by Data Detective from official public APIs.

Run: python3 scripts/fetch_data.py  ->  writes src/data/generated/indicators.json
No API keys are needed. Every series keeps its source, dataset code and retrieval date.
"""
import json, datetime, pathlib, csv, io, sys
import requests

START, END = 1998, 2025
GEOS = {"ES": "ESP", "PT": "PRT", "IT": "ITA", "FR": "FRA", "DE": "DEU", "EU27_2020": None}
OUT = pathlib.Path(__file__).resolve().parent.parent / "src/data/generated/indicators.json"
TODAY = datetime.date.today().isoformat()
ESTAT = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
S = requests.Session()


class Series(dict):
    """geo -> {year: value}, plus years Eurostat flags as a break in series ("b")."""
    flags: dict


def eurostat(dataset, **filters):
    params = [("format", "JSON"), ("lang", "EN")] + [("geo", g) for g in GEOS]
    params += [(k, v) for k, v in filters.items()]
    d = S.get(ESTAT + dataset, params=params, timeout=120).json()
    if "error" in d:
        raise RuntimeError(f"{dataset}: {d['error']}")
    ids, sizes = d["id"], d["size"]
    idx = {n: {v: k for k, v in d["dimension"][n]["category"]["index"].items()} for n in ids}
    out = Series()
    out.flags = {}
    status = d.get("status", {})
    for flat, val in d["value"].items():
        st = status.get(flat, "")
        flat = int(flat)
        coords = {}
        for n, s in zip(reversed(ids), reversed(sizes)):
            coords[n] = idx[n][flat % s]
            flat //= s
        yr = int(coords["time"][:4])
        if START <= yr <= END and val is not None:
            out.setdefault(coords["geo"], {})[yr] = float(val)
            if "b" in st:
                out.flags.setdefault(coords["geo"], set()).add(yr)
    return out


def worldbank(indicator):
    out = {}
    for g, iso3 in GEOS.items():
        if not iso3:
            continue
        r = S.get(f"https://api.worldbank.org/v2/country/{iso3}/indicator/{indicator}",
                  params={"format": "json", "per_page": 200, "date": f"{START}:{END}"}, timeout=60).json()
        for row in r[1] or []:
            if row["value"] is not None:
                out.setdefault(g, {})[int(row["date"])] = float(row["value"])
    return out


def oecd(flow, key_tpl):
    out = {}
    keys = "+".join(v for v in GEOS.values() if v)
    url = f"https://sdmx.oecd.org/public/rest/data/{flow}/{key_tpl.format(geo=keys)}?startPeriod={START}"
    txt = S.get(url, headers={"Accept": "application/vnd.sdmx.data+csv"}, timeout=120).text
    inv = {v: k for k, v in GEOS.items() if v}
    for row in csv.DictReader(io.StringIO(txt)):
        yr = int(row["TIME_PERIOD"][:4])
        if START <= yr <= END and row["OBS_VALUE"]:
            out.setdefault(inv[row["REF_AREA"]], {})[yr] = float(row["OBS_VALUE"])
    if not out:
        raise RuntimeError(f"OECD {flow} returned nothing: {txt[:200]}")
    return out


def combine(a, b, fn):
    out = {}
    for g in a:
        for y, v in a[g].items():
            w = b.get(g, {}).get(y)
            if w not in (None, 0):
                out.setdefault(g, {})[y] = fn(v, w)
    return out


def rebase(series, base_year=2015):
    out = {}
    for g, s in series.items():
        if base_year in s:
            out[g] = {y: v / s[base_year] * 100 for y, v in s.items()}
    return out


def scale(series, k):
    return {g: {y: v * k for y, v in s.items()} for g, s in series.items()}


EUROSTAT_SRC = "Eurostat"
LINK = lambda code: f"https://ec.europa.eu/eurostat/databrowser/view/{code}/default/table?lang=en"
INDICATORS = []


def add(id, dimension, data, **meta):
    flags = getattr(data, "flags", {})
    flagged = sorted(y for y in flags.get("ES", set()) & set(data.get("ES", {})) if y >= meta.get("keep_from", 0))
    breaks = meta.setdefault("breaks", [])
    for y in flagged:
        if not any(b["year"] == y for b in breaks):
            breaks.append({"year": y, "note": "Eurostat flags a break in Spain's series this year: figures before and after are not fully comparable."})
    es_years = [int(y) for y in data.get("ES", {})]
    if es_years:
        breaks[:] = [b for b in breaks if min(es_years) < b["year"] <= max(es_years)]
    breaks.sort(key=lambda b: b["year"])
    keep_from = meta.pop("keep_from", None)
    if keep_from:
        data = {g: {y: v for y, v in s.items() if y >= keep_from} for g, s in data.items()}
    data = {g: {str(y): round(v, 4) for y, v in sorted(s.items())} for g, s in data.items() if s}
    meta.setdefault("retrieved", TODAY)
    INDICATORS.append({"id": id, "dimension": dimension, "data": data, **meta})
    es = data.get("ES", {})
    print(f"{id:24s} ES {min(es) if es else '-'}-{max(es) if es else '-'} ({len(es)} pts) geos={list(data)}", file=sys.stderr)


def main():
    # ---------- shared ----------
    pop = eurostat("demo_gind", indic_de="JAN")
    hicp = eurostat("prc_hicp_aind", coicop="CP00", unit="INX_A_AVG")

    # ---------- immigration ----------
    imm = eurostat("migr_imm1ctz", age="TOTAL", sex="T", agedef="COMPLET", citizen="TOTAL", unit="NR")
    migr_breaks = [{"year": 2008, "note": "From 2008 Spain's figures come from INE's Migration Statistics; earlier years are derived from residential-change records (EVR) and are not fully comparable."}]
    add("imm_inflow", "immigration", imm, label="Immigrants arriving per year", short="Arrivals",
        unit="people per year", format="count",
        definition="People who established their usual residence in the country during the year, of any citizenship (including returning nationals).",
        source={"org": EUROSTAT_SRC, "dataset": "migr_imm1ctz", "url": LINK("migr_imm1ctz"), "upstream": "INE Spain"},
        breaks=migr_breaks)
    add("imm_rate", "immigration", combine(imm, pop, lambda a, b: a / b * 1000),
        label="Immigrants arriving per 1,000 residents", short="Arrival rate", unit="per 1,000 residents", format="decimal1",
        definition="Annual immigration flow divided by the population on 1 January, times 1,000 (our calculation from two Eurostat tables).",
        source={"org": EUROSTAT_SRC, "dataset": "migr_imm1ctz ÷ demo_gind", "url": LINK("migr_imm1ctz"), "upstream": "INE Spain"},
        breaks=migr_breaks, derived=True)
    fb = eurostat("migr_pop3ctb", age="TOTAL", sex="T", c_birth="FOR", unit="NR")
    tot = eurostat("migr_pop3ctb", age="TOTAL", sex="T", c_birth="TOTAL", unit="NR")
    fb_meta = dict(source={"org": EUROSTAT_SRC, "dataset": "migr_pop3ctb", "url": LINK("migr_pop3ctb"), "upstream": "INE Spain (Padrón municipal / population figures)"})
    add("foreign_born", "immigration", fb, label="People living in the country who were born abroad", short="Foreign-born residents",
        unit="people", format="count",
        definition="Resident population on 1 January born outside the reporting country, regardless of current citizenship. Includes Spanish citizens born abroad.",
        notes="Spain's population register (Padrón) also records many migrants without legal residence, because registering gives access to healthcare and schooling, so coverage of irregular migrants is better than in most countries.",
        **fb_meta)
    add("foreign_born_share", "immigration", combine(fb, tot, lambda a, b: a / b * 100),
        label="Share of the population born abroad", short="Foreign-born share", unit="% of population", format="pct1",
        definition="Foreign-born residents as a percentage of the total resident population on 1 January (our calculation).",
        notes="Spain's population register (Padrón) also records many migrants without legal residence.", derived=True, **fb_meta)
    add("net_migration_rate", "immigration", eurostat("demo_gind", indic_de="CNMIGRATRT"),
        label="Net migration per 1,000 residents", short="Net migration", unit="per 1,000 residents", format="decimal1",
        definition="Arrivals minus departures (plus statistical adjustment) per 1,000 average population. Negative values mean more people left than arrived.",
        source={"org": EUROSTAT_SRC, "dataset": "demo_gind", "url": LINK("demo_gind"), "upstream": "INE Spain"})

    # ---------- crime ----------
    crime_meta = dict(dimension="crime", unit="per 100,000 residents", format="decimal1",
                      source={"org": EUROSTAT_SRC, "dataset": "crim_off_cat", "url": LINK("crim_off_cat"), "upstream": "Spanish Ministry of the Interior (police-recorded offences)"},
                      notes="Police-recorded offences reflect both crime and how often victims report it and police record it. Legal definitions differ between countries, so Eurostat advises against direct cross-country comparison of levels.")
    sp_break_2015 = {"year": 2015, "note": "Spain's Criminal Code reform (LO 1/2015) abolished minor offences ('faltas'), reclassifying some as minor crimes ('delitos leves')."}
    jump_2010 = {"year": 2010, "note": "The abrupt jump between 2009 and 2010 is too large to be a real change in crime and most likely reflects a recording or classification change. Treat 2008–2009 as not comparable with later years."}
    cats = [
        ("crime_homicide", "ICCS0101", "Intentional homicide", "Homicide", "Unlawful death inflicted on a person with the intent to cause death or serious injury.", []),
        ("crime_assault", "ICCS020111", "Serious assault", "Serious assault", "Intentional or reckless application of force causing serious bodily injury.", [jump_2010, sp_break_2015]),
        ("crime_sexual", "ICCS0301", "Sexual violence", "Sexual violence", "Rape and sexual assault (ICCS 0301).", [sp_break_2015, {"year": 2022, "note": "Organic Law 10/2022 ('only yes means yes') redefined sexual offences, merging 'sexual abuse' into 'sexual assault'. Reporting has also risen with greater awareness."}]),
        ("crime_robbery", "ICCS0401", "Robbery", "Robbery", "Taking property from a person using force or threat of force.", [sp_break_2015]),
        ("crime_burglary", "ICCS0501", "Burglary", "Burglary", "Gaining unauthorised access to premises with intent to commit a crime.", [sp_break_2015]),
        ("crime_theft", "ICCS0502", "Theft", "Theft", "Taking property without consent and without force against a person (e.g. pickpocketing, shoplifting).", [jump_2010, sp_break_2015]),
        ("crime_fraud", "ICCS0701", "Fraud", "Fraud", "Obtaining money or benefits by deceit, including online scams.", [sp_break_2015]),
        ("crime_cyber", "ICCS0903", "Acts against computer systems", "Cybercrime", "Unauthorised access to, interference with or interception of computer systems and data.", []),
        ("crime_drugs", "ICCS0601", "Drug offences", "Drug offences", "Unlawful possession, use, production or trafficking of controlled drugs. Strongly driven by police activity.", []),
    ]
    for id, code, label, short, definition, breaks in cats:
        add(id, data=eurostat("crim_off_cat", iccs=code, unit="P_HTHAB"), label=f"{label} recorded by police", short=short,
            definition=definition, breaks=breaks, **crime_meta)
    add("crime_homicide_long", "crime", worldbank("VC.IHR.PSRC.P5"), label="Intentional homicide (long series)", short="Homicide (UNODC)",
        unit="per 100,000 residents", format="decimal2",
        definition="Intentional homicides per 100,000 people, compiled by UNODC from national criminal justice and public-health sources.",
        source={"org": "UNODC via World Bank", "dataset": "VC.IHR.PSRC.P5", "url": "https://data.worldbank.org/indicator/VC.IHR.PSRC.P5"},
        notes="The only crime measure available as a consistent series for Spain back to the early 2000s.")

    # ---------- economy ----------
    add("gdp_real", "economy", scale(eurostat("nama_10_gdp", na_item="B1GQ", unit="CLV10_MEUR"), 1 / 1000),
        label="Size of the economy (real GDP)", short="Real GDP", unit="€ billion, 2010 prices", format="bn",
        definition="Gross domestic product in chain-linked volumes (2010 euros), removing the effect of inflation.",
        notes="GDP grows mechanically when the population grows; GDP per person is a better guide to average living standards.",
        source={"org": EUROSTAT_SRC, "dataset": "nama_10_gdp", "url": LINK("nama_10_gdp"), "upstream": "INE Spain"})
    add("gdp_pc_real", "economy", eurostat("nama_10_pc", na_item="B1GQ", unit="CLV10_EUR_HAB"),
        label="Real GDP per person", short="GDP per person", unit="€ per person, 2010 prices", format="eur",
        definition="Real GDP divided by population (chain-linked volumes, 2010 euros).",
        source={"org": EUROSTAT_SRC, "dataset": "nama_10_pc", "url": LINK("nama_10_pc"), "upstream": "INE Spain"})
    add("employment", "economy", scale(eurostat("nama_10_pe", na_item="EMP_DC", unit="THS_PER"), 1 / 1000),
        label="People in work", short="Employment", unit="million people", format="mn",
        definition="Total employment (domestic concept, national accounts), in millions of people.",
        source={"org": EUROSTAT_SRC, "dataset": "nama_10_pe", "url": LINK("nama_10_pe"), "upstream": "INE Spain"})
    une = eurostat("lfsa_urgan", age="Y15-74", sex="T", citizen="TOTAL", unit="PC")
    add("unemployment", "economy", une, label="Unemployment rate", short="Unemployment", unit="% of labour force", format="pct1",
        definition="Unemployed people aged 15–74 as a percentage of the labour force (Labour Force Survey, ILO definition).",
        breaks=[{"year": 2021, "note": "EU-wide Labour Force Survey methodology change (IESS regulation) in 2021."}],
        source={"org": EUROSTAT_SRC, "dataset": "lfsa_urgan", "url": LINK("lfsa_urgan"), "upstream": "INE Spain (EPA)"})
    add("employment_rate", "economy", eurostat("lfsa_ergan", age="Y20-64", sex="T", citizen="TOTAL", unit="PC"),
        label="Employment rate (age 20–64)", short="Employment rate", unit="% of people aged 20–64", format="pct1",
        definition="Employed people aged 20–64 as a share of everyone in that age group.",
        breaks=[{"year": 2021, "note": "EU-wide Labour Force Survey methodology change in 2021."}],
        source={"org": EUROSTAT_SRC, "dataset": "lfsa_ergan", "url": LINK("lfsa_ergan"), "upstream": "INE Spain (EPA)"})
    add("productivity", "economy", eurostat("nama_10_lp_ulc", na_item="RLPR_HW", unit="I15"),
        label="Output per hour worked", short="Productivity", unit="index, 2015 = 100", format="index",
        definition="Real labour productivity per hour worked.",
        source={"org": EUROSTAT_SRC, "dataset": "nama_10_lp_ulc", "url": LINK("nama_10_lp_ulc"), "upstream": "INE Spain"})

    # ---------- housing ----------
    HP = "OECD.ECO.MPD,DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES,1.0"
    hp_src = {"org": "OECD", "dataset": "Analytical house prices (DF_HOUSE_PRICES)", "url": "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_AN_HOUSE_PRICES%40DF_HOUSE_PRICES&df[ag]=OECD.ECO.MPD", "upstream": "INE / Ministry of Housing (Spain)"}
    add("house_price_real", "housing", oecd(HP, "{geo}.A.RHP."), label="House prices after inflation", short="Real house prices",
        unit="index, 2015 = 100", format="index", definition="Nominal house price index deflated by the consumer price index.", source=hp_src)
    add("house_price_nominal", "housing", oecd(HP, "{geo}.A.HPI."), label="House prices", short="House prices",
        unit="index, 2015 = 100", format="index", definition="Nominal residential property price index.", source=hp_src)
    rent = oecd(HP, "{geo}.A.RPI.")
    add("rent_nominal", "housing", rent, label="Rents", short="Rents", unit="index, 2015 = 100", format="index",
        definition="Rent component of the consumer price index.",
        notes="In Spain this index tracks rents paid on all existing contracts, so it rises far more slowly than asking rents for new contracts (e.g. listing portals or INE's experimental rental index).",
        source=hp_src)
    hicp15 = rebase(hicp)
    add("rent_real", "housing", combine(rebase(rent), hicp15, lambda a, b: a / b * 100), label="Rents after inflation", short="Real rents",
        unit="index, 2015 = 100", format="index",
        definition="Rent index divided by the overall consumer price index (HICP), both 2015 = 100 (our calculation). Above 100 means rents rose faster than prices in general since 2015.",
        notes="In Spain this index tracks rents on all existing contracts, so it understates the rise in rents for new tenants.",
        source={"org": "OECD + Eurostat", "dataset": "DF_HOUSE_PRICES (RPI) ÷ prc_hicp_aind", "url": LINK("prc_hicp_aind")}, derived=True)
    add("price_to_income", "housing", oecd(HP, "{geo}.A.HPI_YDH."), label="House prices relative to incomes", short="Price-to-income",
        unit="index, 2015 = 100", format="index",
        definition="Nominal house prices divided by nominal disposable income per person. Higher means housing is less affordable.", source=hp_src)
    add("price_to_rent", "housing", oecd(HP, "{geo}.A.HPI_RPI."), label="House prices relative to rents", short="Price-to-rent",
        unit="index, 2015 = 100", format="index", definition="Nominal house prices divided by the rent index.", source=hp_src)

    # ---------- living standards ----------
    add("real_wage", "living", oecd("OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,", "{geo}.WG.EUR.A.Q..."),
        label="Average annual wage after inflation", short="Real wages", unit="€ per year, constant prices", format="eur",
        definition="Average annual wages per full-time-equivalent employee, at constant prices (latest-year euros).",
        source={"org": "OECD", "dataset": "Average annual wages (AV_AN_WAGE)", "url": "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_EARNINGS%40AV_AN_WAGE&df[ag]=OECD.ELS.SAE"})
    add("disp_income_real", "living", eurostat("nasa_10_ki", na_item="B7G_R_HAB_2010", sector="S14_S15", unit="PC"),
        label="Household income after inflation, per person", short="Real household income", unit="index, 2010 = 100", format="index",
        definition="Real adjusted gross disposable income of households per person: income after taxes and benefits, including the value of public services such as health and education, adjusted for inflation.",
        source={"org": EUROSTAT_SRC, "dataset": "nasa_10_ki", "url": LINK("nasa_10_ki"), "upstream": "INE Spain"})
    med = eurostat("ilc_di03", age="TOTAL", sex="T", statinfo="MED_EI", unit="EUR")
    med = {g: {y: v for y, v in s.items() if y >= 2004} for g, s in med.items()}  # pre-2004 values come from the ECHP survey
    add("median_income_real", "living", combine(med, hicp15, lambda a, b: a / b * 100),
        label="Typical (median) income after inflation", short="Median income", unit="€ per year, 2015 prices", format="eur",
        definition="Median equivalised net income from the EU-SILC survey, deflated by the HICP (our calculation). Survey year shown; incomes refer to the previous calendar year.",
        breaks=[{"year": 2004, "note": "Spain's EU-SILC series starts in 2004; earlier survey (ECHP) figures are excluded as not comparable."}],
        source={"org": EUROSTAT_SRC, "dataset": "ilc_di03 ÷ prc_hicp_aind", "url": LINK("ilc_di03"), "upstream": "INE Spain (ECV)"}, derived=True)
    add("gini", "living", eurostat("ilc_di12"),
        label="Income inequality (Gini coefficient)", short="Inequality (Gini)", unit="0 = everyone equal, 100 = one person has everything", format="decimal1",
        definition="Gini coefficient of equivalised disposable income (EU-SILC). Higher means more unequal. Survey year shown; incomes refer to the previous calendar year.",
        breaks=[{"year": 2004, "note": "Spain's EU-SILC series starts in 2004; earlier survey (ECHP) figures are excluded as not comparable."}],
        source={"org": EUROSTAT_SRC, "dataset": "ilc_di12", "url": LINK("ilc_di12"), "upstream": "INE Spain (ECV)"}, keep_from=2004)
    add("consumption_pps", "living", eurostat("prc_ppp_ind", na_item="VI_PPS_EU27_2020_HAB", ppp_cat="A01"),
        label="Material living standards vs EU average", short="Purchasing power", unit="EU average = 100", format="index",
        definition="Actual individual consumption per person in purchasing power standards, relative to the EU-27 average (= 100). Accounts for price differences between countries.",
        source={"org": EUROSTAT_SRC, "dataset": "prc_ppp_ind", "url": LINK("prc_ppp_ind")})

    OUT.write_text(json.dumps({"generated": TODAY, "indicators": INDICATORS}, ensure_ascii=False, separators=(",", ":")))
    print("wrote", OUT, OUT.stat().st_size, "bytes", file=sys.stderr)


if __name__ == "__main__":
    main()
