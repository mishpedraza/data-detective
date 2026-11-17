"""Fetch every indicator used by Data Detective from official public APIs.

Run: python3 scripts/fetch_data.py  ->  writes src/data/generated/indicators.json
US crime figures use the FBI Crime Data Explorer API (FBI_API_KEY from api.data.gov; DEMO_KEY otherwise,
with responses cached in scripts/.cache). Every series keeps its source, dataset code and retrieval date.
"""
import time, os
import json, datetime, pathlib, csv, io, sys
import requests

START, END = 1998, 2025
US_ONLY = {}
GEOS = {"ES": "ESP", "PT": "PRT", "IT": "ITA", "FR": "FRA", "DE": "DEU", "EU27_2020": None}
OUT = pathlib.Path(__file__).resolve().parent.parent / "src/data/generated/indicators.json"
TODAY = datetime.date.today().isoformat()
ESTAT = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
S = requests.Session()


class Series(dict):
    """geo -> {year: value}, plus years Eurostat flags as a break in series ("b")."""
    flags: dict


def eurostat(dataset, extra_geos=(), **filters):
    params = [("format", "JSON"), ("lang", "EN")] + [("geo", g) for g in list(GEOS) + list(extra_geos)]
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


def worldbank(indicator, extra=None, only_extra=False):
    out = {}
    for g, iso3 in (({} if only_extra else GEOS) | (extra or {})).items():
        if not iso3:
            continue
        for attempt in range(4):
            try:
                r = S.get(f"https://api.worldbank.org/v2/country/{iso3}/indicator/{indicator}",
                          params={"format": "json", "per_page": 200, "date": f"{START}:{END}"}, timeout=120).json()
                break
            except (requests.RequestException, ValueError):
                if attempt == 3:
                    raise
                time.sleep(20)
        for row in r[1] or []:
            if row["value"] is not None:
                out.setdefault(g, {})[int(row["date"])] = float(row["value"])
    return out


def oecd(flow, key_tpl, extra=None):
    out = {}
    geos = GEOS | (extra or {})
    keys = "+".join(v for v in geos.values() if v)
    url = f"https://sdmx.oecd.org/public/rest/data/{flow}/{key_tpl.format(geo=keys)}?startPeriod={START}"
    txt = S.get(url, headers={"Accept": "application/vnd.sdmx.data+csv"}, timeout=120).text
    inv = {v: k for k, v in geos.items() if v}
    for row in csv.DictReader(io.StringIO(txt)):
        yr = int(row["TIME_PERIOD"][:4])
        if START <= yr <= END and row["OBS_VALUE"]:
            out.setdefault(inv[row["REF_AREA"]], {})[yr] = float(row["OBS_VALUE"])
    if not out:
        raise RuntimeError(f"OECD {flow} returned nothing: {txt[:200]}")
    return out


FRED = "https://fred.stlouisfed.org/graph/fredgraph.csv"


def fred(sid):
    """Annual averages of a FRED series (BLS, BEA and other US agencies), as {year: value}."""
    txt = S.get(FRED, params={"id": sid, "fq": "Annual", "fam": "avg", "cosd": f"{START}-01-01"}, timeout=120).text
    out = {}
    for row in csv.DictReader(io.StringIO(txt)):
        y, v = int(row["observation_date"][:4]), row.get(sid, "")
        if v not in ("", ".") and START <= y <= END:
            out[y] = float(v)
    if not out:
        raise RuntimeError(f"FRED {sid} returned nothing: {txt[:200]}")
    return out


CACHE = pathlib.Path(__file__).resolve().parent / ".cache"


def fbi(*offenses):
    """US offences per 100,000 residents from the FBI Crime Data Explorer: monthly rates (offences reported by
    participating agencies per 100,000 people they cover) summed over complete years, then summed over offences."""
    out = {}
    for off in offenses:
        f = CACHE / f"fbi_{off}_{TODAY}.json"
        if f.exists():
            d = json.loads(f.read_text())
        else:
            d = S.get(f"https://api.usa.gov/crime/fbi/cde/summarized/national/{off}",
                      params={"from": f"01-{START}", "to": f"12-{END}", "API_KEY": os.environ.get("FBI_API_KEY", "DEMO_KEY")}, timeout=180).json()
            CACHE.mkdir(exist_ok=True)
            f.write_text(json.dumps(d))
        months = {}
        for k, v in d["offenses"]["rates"]["United States Offenses"].items():
            if v is not None:
                months.setdefault(int(k[3:]), []).append(v)
        for y, vs in months.items():
            if len(vs) == 12 and START <= y <= END:
                out[y] = out.get(y, 0) + sum(vs)
    if not out:
        raise RuntimeError(f"FBI {offenses} returned nothing")
    return out


def rebase1(s, base_year):
    return {y: v / s[base_year] * 100 for y, v in s.items()} if base_year in s else {}


def combine(a, b, fn):
    out = {}
    for g in a:
        for y, v in a[g].items():
            w = b.get(g, {}).get(y)
            if w not in (None, 0):
                out.setdefault(g, {})[y] = fn(v, w)
    out = Series(out)
    out.flags = {}
    for src in (a, b):
        for g, ys in getattr(src, "flags", {}).items():
            out.flags.setdefault(g, set()).update(ys)
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
    other = {g: sorted(y for y in ys & set(data.get(g, {})) if y >= meta.get("keep_from", 0) and y > min(data[g])) for g, ys in flags.items() if g != "ES"}
    if any(other.values()):
        meta["geoBreaks"] = {**meta.get("geoBreaks", {}), **{g: ys for g, ys in other.items() if ys}}
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
    fbs = combine(fb, tot, lambda a, b: a / b * 100)
    us_fb = {}
    txt = S.get("https://sdmx.oecd.org/public/rest/data/OECD.ELS.IMD,DSD_MIG_F@DF_MIG_POPF,/USA.W.......?startPeriod=" + str(START),
                headers={"Accept": "application/vnd.sdmx.data+csv"}, timeout=180).text
    for row in csv.DictReader(io.StringIO(txt)):
        if row["MEASURE"] == "B14" and row["SEX"] == "_T" and row["OBS_VALUE"]:
            us_fb[int(row["TIME_PERIOD"][:4])] = float(row["OBS_VALUE"])
    us_pop = worldbank("SP.POP.TOTL", extra={"US": "USA"}, only_extra=True).get("US", {})
    if not us_fb or not us_pop:
        raise RuntimeError("US foreign-born share: OECD or World Bank returned nothing")
    fbs["US"] = {y: v / us_pop[y] * 100 for y, v in us_fb.items() if y in us_pop and START <= y <= END}
    add("foreign_born_share", "immigration", fbs,
        geoSources={"US": {"org": "OECD International Migration Database ÷ World Bank population", "dataset": "DF_MIG_POPF (B14) ÷ SP.POP.TOTL",
                           "url": "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_MIG_F%40DF_MIG_POPF&df[ag]=OECD.ELS.IMD",
                           "note": "US figures come from the Census Bureau's surveys via the OECD. The US counts people who were not US citizens at birth, so people born abroad to US-citizen parents are excluded; Eurostat counts everyone born abroad. The difference is small but means levels are not exactly comparable."}},
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
        ("crime_sexual", "ICCS0301", "Sexual violence", "Sexual violence", "Offences of rape (ICCS 03011) and sexual assault (ICCS 03012) recorded by police. Counts offences known to police, not victims, arrests, prosecutions or convictions.", [{"year": 2015, "note": "Spain's Criminal Code reform (LO 1/2015) raised the age of sexual consent to 16 and abolished minor offences ('faltas')."}, {"year": 2022, "note": "Organic Law 10/2022 ('only yes means yes', in force October 2022) removed the legal distinction between sexual 'abuse' and sexual 'aggression': all non-consensual sexual acts became sexual aggression."}]),
        ("crime_robbery", "ICCS0401", "Robbery", "Robbery", "Taking property from a person using force or threat of force.", [sp_break_2015]),
        ("crime_burglary", "ICCS0501", "Burglary", "Burglary", "Gaining unauthorised access to premises with intent to commit a crime.", [sp_break_2015]),
        ("crime_theft", "ICCS0502", "Theft", "Theft", "Taking property without consent and without force against a person (e.g. pickpocketing, shoplifting).", [jump_2010, sp_break_2015]),
        ("crime_fraud", "ICCS0701", "Fraud", "Fraud", "Obtaining money or benefits by deceit, including online scams.", [sp_break_2015]),
        ("crime_cyber", "ICCS0903", "Acts against computer systems", "Cybercrime", "Unauthorised access to, interference with or interception of computer systems and data.", []),
        ("crime_drugs", "ICCS0601", "Drug offences", "Drug offences", "Unlawful possession, use, production or trafficking of controlled drugs. Strongly driven by police activity.", []),
    ]
    FBI_URL = "https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/crime-trend"
    FBI_NOTE = ("US figures are offences known to police reported to the FBI by participating agencies, per 100,000 people those agencies cover. "
                "US and EU legal definitions differ, so compare trends, not levels. In 2021 the FBI's switch to its new reporting system (NIBRS) cut coverage to about 80% of the population, so treat 2021 with caution.")
    us_crime = {"crime_homicide": (("homicide",), "Murder and non-negligent manslaughter."),
                "crime_assault": (("aggravated-assault",), "FBI aggravated assault: an attack intended to cause severe injury, usually with a weapon."),
                "crime_robbery": (("robbery",), "FBI robbery."),
                "crime_burglary": (("burglary",), "FBI burglary, including non-residential premises."),
                "crime_theft": (("larceny", "motor-vehicle-theft"), "FBI larceny-theft plus motor vehicle theft, to match the EU category, which includes vehicle theft.")}
    for id, code, label, short, definition, breaks in cats:
        extra = {}
        data = eurostat("crim_off_cat", iccs=code, unit="P_HTHAB")
        if id in us_crime:
            offs, what = us_crime[id]
            data["US"] = fbi(*offs)
            extra["geoSources"] = {"US": {"org": "FBI Crime Data Explorer", "dataset": "Summarized offences: " + ", ".join(offs), "url": FBI_URL, "note": what + " " + FBI_NOTE}}
        if id == "crime_sexual":
            extra["parts"] = [{"label": lab, "code": c, "data": {str(y): round(v, 4) for y, v in sorted(eurostat("crim_off_cat", iccs=c, unit="P_HTHAB").get("ES", {}).items())}}
                              for c, lab in (("ICCS03011", "Rape"), ("ICCS03012", "Sexual assault"))]
        add(id, data=data, label=f"{label} recorded by police", short=short,
            definition=definition, breaks=breaks, **crime_meta, **extra)
    add("crime_homicide_long", "crime", worldbank("VC.IHR.PSRC.P5", extra={"US": "USA"}), label="Intentional homicide (long series)", short="Homicide (UNODC)",
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
    gdp_pc = eurostat("nama_10_pc", na_item="B1GQ", unit="CLV10_EUR_HAB")
    gdp_pc["US"] = worldbank("NY.GDP.PCAP.KD", extra={"US": "USA"}, only_extra=True)["US"]
    add("gdp_pc_real", "economy", gdp_pc,
        geoUnits={"US": {"unit": "US$ per person, 2015 prices", "format": "usd"}},
        geoSources={"US": {"org": "World Bank", "dataset": "NY.GDP.PCAP.KD", "url": "https://data.worldbank.org/indicator/NY.GDP.PCAP.KD?locations=US",
                           "note": "US figures are World Bank real GDP per person in 2015 dollars (from BEA national accounts); compare growth rates, not levels."}},
        label="Real GDP per person", short="GDP per person", unit="€ per person, 2010 prices", format="eur",
        definition="Real GDP divided by population (chain-linked volumes, 2010 euros).",
        source={"org": EUROSTAT_SRC, "dataset": "nama_10_pc", "url": LINK("nama_10_pc"), "upstream": "INE Spain"})
    add("employment", "economy", scale(eurostat("nama_10_pe", na_item="EMP_DC", unit="THS_PER"), 1 / 1000),
        label="People in work", short="Employment", unit="million people", format="mn",
        definition="Total employment (domestic concept, national accounts), in millions of people.",
        source={"org": EUROSTAT_SRC, "dataset": "nama_10_pe", "url": LINK("nama_10_pe"), "upstream": "INE Spain"})
    une = eurostat("lfsa_urgan", age="Y15-74", sex="T", citizen="TOTAL", unit="PC")
    une["US"] = fred("UNRATE")
    add("unemployment", "economy", une, label="Unemployment rate", short="Unemployment", unit="% of labour force", format="pct1",
        definition="Unemployed people aged 15–74 as a percentage of the labour force (Labour Force Survey, ILO definition).",
        breaks=[{"year": 2021, "note": "EU-wide Labour Force Survey methodology change (IESS regulation) in 2021."}],
        geoSources={"US": {"org": "BLS via FRED", "dataset": "UNRATE (Current Population Survey)", "url": "https://fred.stlouisfed.org/series/UNRATE",
                           "note": "US figures are the BLS unemployment rate for people aged 16 and over; the ILO definition is similar, but the age range differs."}},
        source={"org": EUROSTAT_SRC, "dataset": "lfsa_urgan", "url": LINK("lfsa_urgan"), "upstream": "INE Spain (EPA)"})
    add("employment_rate", "economy", eurostat("lfsa_ergan", age="Y20-64", sex="T", citizen="TOTAL", unit="PC"),
        label="Employment rate (age 20–64)", short="Employment rate", unit="% of people aged 20–64", format="pct1",
        definition="Employed people aged 20–64 as a share of everyone in that age group.",
        breaks=[{"year": 2021, "note": "EU-wide Labour Force Survey methodology change in 2021."}],
        source={"org": EUROSTAT_SRC, "dataset": "lfsa_ergan", "url": LINK("lfsa_ergan"), "upstream": "INE Spain (EPA)"})
    prod = eurostat("nama_10_lp_ulc", na_item="RLPR_HW", unit="I15")
    prod["US"] = rebase1(fred("OPHNFB"), 2015)
    add("productivity", "economy", prod,
        geoSources={"US": {"org": "BLS via FRED", "dataset": "OPHNFB", "url": "https://fred.stlouisfed.org/series/OPHNFB",
                           "note": "US figures are BLS output per hour in the nonfarm business sector, which excludes government, farms and households; the EU figure covers the whole economy."}},
        label="Output per hour worked", short="Productivity", unit="index, 2015 = 100", format="index",
        definition="Real labour productivity per hour worked.",
        source={"org": EUROSTAT_SRC, "dataset": "nama_10_lp_ulc", "url": LINK("nama_10_lp_ulc"), "upstream": "INE Spain"})

    # ---------- housing ----------
    US = {"US": "USA"}
    HP = "OECD.ECO.MPD,DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES,1.0"
    hp_src = {"org": "OECD", "dataset": "Analytical house prices (DF_HOUSE_PRICES)", "url": "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_AN_HOUSE_PRICES%40DF_HOUSE_PRICES&df[ag]=OECD.ECO.MPD", "upstream": "INE / Ministry of Housing (Spain)"}
    add("house_price_real", "housing", oecd(HP, "{geo}.A.RHP.", extra=US), label="House prices after inflation", short="Real house prices",
        unit="index, 2015 = 100", format="index", definition="Nominal house price index deflated by the consumer price index.", source=hp_src)
    add("house_price_nominal", "housing", oecd(HP, "{geo}.A.HPI.", extra=US), label="House prices", short="House prices",
        unit="index, 2015 = 100", format="index", definition="Nominal residential property price index.", source=hp_src)
    rent = oecd(HP, "{geo}.A.RPI.", extra=US)
    add("rent_nominal", "housing", rent, label="Rents", short="Rents", unit="index, 2015 = 100", format="index",
        definition="Rent component of the consumer price index.",
        notes="In Spain this index tracks rents paid on all existing contracts, so it rises far more slowly than asking rents for new contracts (e.g. listing portals or INE's experimental rental index).",
        source=hp_src)
    hicp15 = rebase(hicp)
    hicp15["US"] = rebase1(fred("CPIAUCSL"), 2015)
    add("rent_real", "housing", combine(rebase(rent), hicp15, lambda a, b: a / b * 100), label="Rents after inflation", short="Real rents",
        unit="index, 2015 = 100", format="index",
        definition="Rent index divided by the overall consumer price index (HICP), both 2015 = 100 (our calculation). Above 100 means rents rose faster than prices in general since 2015.",
        notes="In Spain this index tracks rents on all existing contracts, so it understates the rise in rents for new tenants.",
        geoSources={"US": {"org": "OECD + BLS", "dataset": "DF_HOUSE_PRICES (RPI) ÷ CPI-U (CPIAUCSL)", "url": "https://fred.stlouisfed.org/series/CPIAUCSL",
                           "note": "US real rents divide the OECD rent index (from the BLS consumer price index, which also covers existing tenancies) by the US consumer price index."}},
        source={"org": "OECD + Eurostat", "dataset": "DF_HOUSE_PRICES (RPI) ÷ prc_hicp_aind", "url": LINK("prc_hicp_aind")}, derived=True)
    add("price_to_income", "housing", oecd(HP, "{geo}.A.HPI_YDH.", extra=US), label="House prices relative to incomes", short="Price-to-income",
        unit="index, 2015 = 100", format="index",
        definition="Nominal house prices divided by nominal disposable income per person. Higher means housing is less affordable.", source=hp_src)
    add("price_to_rent", "housing", oecd(HP, "{geo}.A.HPI_RPI.", extra=US), label="House prices relative to rents", short="Price-to-rent",
        unit="index, 2015 = 100", format="index", definition="Nominal house prices divided by the rent index.", source=hp_src)

    # ---------- living standards ----------
    rw = oecd("OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,", "{geo}.WG.EUR.A.Q...")
    rw["US"] = oecd("OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,", "{geo}.WG.USD.A.Q...", extra=US_ONLY)["US"]
    add("real_wage", "living", rw,
        geoUnits={"US": {"unit": "US$ per year, constant prices", "format": "usd"}},
        geoSources={"US": {"org": "OECD", "dataset": "Average annual wages (AV_AN_WAGE), US dollars", "url": "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_EARNINGS%40AV_AN_WAGE&df[ag]=OECD.ELS.SAE",
                           "note": "Same OECD definition, in constant US dollars; compare growth rates, not levels."}},
        label="Average annual wage after inflation", short="Real wages", unit="€ per year, constant prices", format="eur",
        definition="Average annual wages per full-time-equivalent employee, at constant prices (latest-year euros).",
        source={"org": "OECD", "dataset": "Average annual wages (AV_AN_WAGE)", "url": "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_EARNINGS%40AV_AN_WAGE&df[ag]=OECD.ELS.SAE"})
    dir_ = eurostat("nasa_10_ki", na_item="B7G_R_HAB_2010", sector="S14_S15", unit="PC")
    dir_["US"] = rebase1(fred("A229RX0"), 2010)
    add("disp_income_real", "living", dir_,
        geoSources={"US": {"org": "BEA via FRED", "dataset": "A229RX0", "url": "https://fred.stlouisfed.org/series/A229RX0",
                           "note": "US figures are BEA real disposable personal income per person (2010 = 100). Unlike the EU measure, it does not add the value of public services such as health and education, so compare trends with care."}},
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

    add("deprivation", "living", eurostat("ilc_mdsd11", age="TOTAL", sex="T", unit="PC"),
        label="People in severe material and social deprivation", short="Severe deprivation", unit="% of population", format="pct1",
        definition="Share of people who cannot afford at least 7 of 13 everyday items, such as keeping the home warm, a week's holiday, replacing worn-out clothes or facing an unexpected expense (EU-SILC). Survey year shown.",
        breaks=[{"year": 2015, "note": "The EU definition starts in 2015; the older severe material deprivation measure uses different items and is not joined to it."}],
        source={"org": EUROSTAT_SRC, "dataset": "ilc_mdsd11", "url": LINK("ilc_mdsd11"), "upstream": "INE Spain (ECV)"}, keep_from=2015)

    add("poverty_rate", "living", eurostat("ilc_li02", statinfo="MED_EI", rskpovth="B_60", unit="PC", age="TOTAL", sex="T"),
        label="People at risk of poverty", short="At-risk-of-poverty rate", unit="% of population", format="pct1",
        definition="Share of people whose equivalised disposable income is below 60% of their country's median (EU-SILC). This is a relative measure: it tracks how many fall far behind the typical household, not whether incomes rose or fell. Survey year shown; incomes refer to the previous calendar year.",
        breaks=[{"year": 2004, "note": "Spain's EU-SILC series starts in 2004; earlier survey (ECHP) figures are excluded as not comparable."}],
        source={"org": EUROSTAT_SRC, "dataset": "ilc_li02", "url": LINK("ilc_li02"), "upstream": "INE Spain (ECV)"}, keep_from=2004)
    add("housing_overburden", "living", eurostat("ilc_lvho07a", rskpovth="TOTAL", unit="PC", age="TOTAL", sex="T"),
        label="People spending over 40% of income on housing", short="Housing cost overburden", unit="% of population", format="pct1",
        definition="Share of people living in households where total housing costs, net of housing allowances, exceed 40% of disposable income, net of housing allowances (EU-SILC). Survey year shown.",
        breaks=[{"year": 2004, "note": "Spain's EU-SILC series starts in 2004; earlier survey (ECHP) figures are excluded as not comparable."}],
        source={"org": EUROSTAT_SRC, "dataset": "ilc_lvho07a", "url": LINK("ilc_lvho07a"), "upstream": "INE Spain (ECV)"}, keep_from=2004)
    ses = eurostat("earn_ses_pub2s", sizeclas="GE10", sex="T", unit="EUR")
    med_pay = combine(ses, hicp15, lambda a, b: a / b * 100)
    med_pay["US"] = fred("LES1252881600Q")
    add("median_earnings_real", "living", med_pay,
        geoUnits={"US": {"unit": "US$ per week, 1982–84 prices", "format": "usd"}},
        geoSources={"US": {"org": "BLS via FRED", "dataset": "LES1252881600Q (Current Population Survey)", "url": "https://fred.stlouisfed.org/series/LES1252881600Q",
                           "note": "US figures are BLS median usual weekly earnings of full-time wage and salary workers, adjusted for inflation with the CPI-U and surveyed every year. The EU survey measures hourly pay of all employees in firms with 10 or more staff, every four years. Compare the direction and size of change, not levels."}},
        label="Typical (median) hourly pay after inflation", short="Median hourly pay", unit="€ per hour, 2015 prices", format="eur2",
        definition="Median gross hourly earnings of all employees in firms with 10 or more employees, from the four-yearly Structure of Earnings Survey (2006, 2010, 2014, 2018, 2022), deflated by the HICP (our calculation). Excludes apprentices and the smallest firms.",
        source={"org": EUROSTAT_SRC, "dataset": "earn_ses_pub2s ÷ prc_hicp_aind", "url": LINK("earn_ses_pub2s"), "upstream": "INE Spain (Encuesta de Estructura Salarial)"}, derived=True)

    def vs_us(src):
        us = src.get("US", {})
        return {g: {y: v / us[y] * 100 for y, v in ys.items() if us.get(y)} for g, ys in src.items() if g != "US"}
    PPP_NOTE = "Purchasing power parities convert each country's prices to a common basis; they are estimates and are revised, so small differences between countries are not meaningful."
    add("gdp_pc_vs_us", "economy", vs_us(eurostat("prc_ppp_ind", extra_geos=["US"], na_item="VI_PPS_EU27_2020_HAB", ppp_cat="GDP")),
        label="GDP per person compared with the United States", short="GDP per person vs US", unit="United States = 100", format="index",
        definition="GDP per person in purchasing power standards, as a share of the US level (US = 100). Our calculation from Eurostat's volume indices, which include the US. " + PPP_NOTE,
        source={"org": EUROSTAT_SRC, "dataset": "prc_ppp_ind (GDP)", "url": LINK("prc_ppp_ind")}, derived=True)
    add("aic_vs_us", "living", vs_us(eurostat("prc_ppp_ind", extra_geos=["US"], na_item="VI_PPS_EU27_2020_HAB", ppp_cat="A01")),
        label="Consumption per person compared with the United States", short="Consumption vs US", unit="United States = 100", format="index",
        definition="Actual individual consumption per person (goods and services households use, including those paid for by government, such as health and education) in purchasing power standards, as a share of the US level (US = 100). Our calculation from Eurostat. " + PPP_NOTE,
        source={"org": EUROSTAT_SRC, "dataset": "prc_ppp_ind (A01)", "url": LINK("prc_ppp_ind")}, derived=True)
    add("wage_vs_us", "living", vs_us(oecd("OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,", "{geo}.WG.USD_PPP.A.Q...", extra={"US": "USA"})),
        label="Average wage compared with the United States", short="Average wage vs US", unit="United States = 100", format="index",
        definition="Average annual wage per full-time-equivalent employee in US dollars at purchasing power parity and constant prices, as a share of the US level (US = 100). Our calculation from OECD data. Averages are pulled up by high earners, more so in the US. " + PPP_NOTE,
        source={"org": "OECD", "dataset": "Average annual wages (AV_AN_WAGE), USD PPP", "url": "https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_EARNINGS%40AV_AN_WAGE&df[ag]=OECD.ELS.SAE"}, derived=True)

    OUT.write_text(json.dumps({"generated": TODAY, "indicators": INDICATORS}, ensure_ascii=False, separators=(",", ":")))
    print("wrote", OUT, OUT.stat().st_size, "bytes", file=sys.stderr)


if __name__ == "__main__":
    main()
