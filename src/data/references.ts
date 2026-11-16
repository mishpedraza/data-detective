import type { Reference } from './types'

const doi = (d: string) => `https://doi.org/${d}`

export const REFERENCES: Record<string, Reference> = {
  ousey2018: { id: 'ousey2018', authors: 'Ousey, G. & Kubrin, C.', year: 2018, title: 'Immigration and Crime: Assessing a Contentious Issue', outlet: 'Annual Review of Criminology 1: 63–84', url: doi('10.1146/annurev-criminol-032317-092026') },
  bianchi2012: { id: 'bianchi2012', authors: 'Bianchi, M., Buonanno, P. & Pinotti, P.', year: 2012, title: 'Do Immigrants Cause Crime?', outlet: 'Journal of the European Economic Association 10(6): 1318–1347', url: doi('10.1111/j.1542-4774.2012.01085.x') },
  bell2013: { id: 'bell2013', authors: 'Bell, B., Fasani, F. & Machin, S.', year: 2013, title: 'Crime and Immigration: Evidence from Large Immigrant Waves', outlet: 'Review of Economics and Statistics 95(4): 1278–1290', url: doi('10.1162/rest_a_00337') },
  alonso2012: { id: 'alonso2012', authors: 'Alonso-Borrego, C., Garoupa, N. & Vázquez, P.', year: 2012, title: 'Does Immigration Cause Crime? Evidence from Spain', outlet: 'American Law and Economics Review 14(1): 165–191', url: doi('10.1093/aler/ahr019') },
  hirschi1983: { id: 'hirschi1983', authors: 'Hirschi, T. & Gottfredson, M.', year: 1983, title: 'Age and the Explanation of Crime', outlet: 'American Journal of Sociology 89(3): 552–584', url: doi('10.1086/227905') },
  gonzalez2013: { id: 'gonzalez2013', authors: 'González, L. & Ortega, F.', year: 2013, title: 'Immigration and Housing Booms: Evidence from Spain', outlet: 'Journal of Regional Science 53(1): 37–59', url: doi('10.1111/jors.12010') },
  saiz2007: { id: 'saiz2007', authors: 'Saiz, A.', year: 2007, title: 'Immigration and Housing Rents in American Cities', outlet: 'Journal of Urban Economics 61(2): 345–371 (working-paper version linked)', url: doi('10.2139/ssrn.570583') },
  carrasco2008: { id: 'carrasco2008', authors: 'Carrasco, R., Jimeno, J. F. & Ortega, A. C.', year: 2008, title: 'The effect of immigration on the labor market performance of native-born workers: some evidence for Spain', outlet: 'Journal of Population Economics 21(3): 627–648', url: doi('10.1007/s00148-006-0112-9') },
  amuedo2011: { id: 'amuedo2011', authors: 'Amuedo-Dorantes, C. & de la Rica, S.', year: 2011, title: 'Complements or substitutes? Task specialization by gender and nativity in Spain', outlet: 'Labour Economics 18(5): 697–707', url: doi('10.1016/j.labeco.2011.02.002') },
  kerr2011: { id: 'kerr2011', authors: 'Kerr, S. P. & Kerr, W. R.', year: 2011, title: 'Economic Impacts of Immigration: A Survey', outlet: 'NBER Working Paper 16736', url: doi('10.3386/w16736') },
  raphael2001: { id: 'raphael2001', authors: 'Raphael, S. & Winter-Ebmer, R.', year: 2001, title: 'Identifying the Effect of Unemployment on Crime', outlet: 'Journal of Law and Economics 44(1): 259–283', url: doi('10.1086/320275') },
  oster2007: { id: 'oster2007', authors: 'Öster, A. & Agell, J.', year: 2007, title: 'Crime and Unemployment in Turbulent Times', outlet: 'Journal of the European Economic Association 5(4): 752–775', url: doi('10.1162/jeea.2007.5.4.752') },
  fajnzylber2002: { id: 'fajnzylber2002', authors: 'Fajnzylber, P., Lederman, D. & Loayza, N.', year: 2002, title: 'Inequality and Violent Crime', outlet: 'Journal of Law and Economics 45(1): 1–39', url: doi('10.1086/338347') },
  oecd2018: { id: 'oecd2018', authors: 'OECD', year: 2018, title: 'Decoupling of wages from productivity: what implications for public policies?', outlet: 'OECD Employment Outlook 2018, chapter 3', url: 'https://www.oecd.org/en/publications/oecd-employment-outlook-2018_empl_outlook-2018-en.html' },
  bde2017: { id: 'bde2017', authors: 'Banco de España', year: 2017, title: 'Informe sobre la crisis financiera y bancaria en España, 2008–2014', outlet: 'Banco de España', url: 'https://www.bde.es/wbe/es/publicaciones/otras-publicaciones/' },
  rd2018: { id: 'rd2018', authors: 'Gobierno de España', year: 2018, title: 'Real Decreto 1462/2018, minimum wage for 2019', outlet: 'Boletín Oficial del Estado, 27 Dec 2018', url: 'https://www.boe.es/eli/es/rd/2018/12/21/1462' },
  eurostatCrime: { id: 'eurostatCrime', authors: 'Eurostat', year: 2024, title: 'Crime statistics – metadata (crim_off_cat): comparability across countries', outlet: 'Eurostat', url: 'https://ec.europa.eu/eurostat/cache/metadata/en/crim_off_cat_esms.htm' },
  lo2022: { id: 'lo2022', authors: 'Gobierno de España', year: 2022, title: 'Ley Orgánica 10/2022 de garantía integral de la libertad sexual', outlet: 'Boletín Oficial del Estado', url: 'https://www.boe.es/eli/es/lo/2022/09/06/10' },
}
