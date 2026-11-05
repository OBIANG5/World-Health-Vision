from dataclasses import dataclass

from analytics_service.models import EconomicLensTone


@dataclass(frozen=True)
class EconomicLensProfile:
    lens_code: str
    lens_display_name: str
    indicator_code: str
    why_it_matters: str


@dataclass(frozen=True)
class RelativeCostLensProfile:
    lens_code: str
    lens_display_name: str
    indicator_code: str
    why_it_matters: str


@dataclass(frozen=True)
class RelativeCostDecisionProfile:
    decision_code: str
    decision_display_name: str
    why_it_matters: str
    supporting_lens_codes: tuple[str, ...]


ECONOMIC_LENS_PROFILES: tuple[EconomicLensProfile, ...] = (
    EconomicLensProfile(
        lens_code="ECONOMIC_SCALE",
        lens_display_name="Échelle économique",
        indicator_code="NY.GDP.MKTP.CD",
        why_it_matters="Indique le poids économique agrégé de la région ou du continent en dollars courants.",
    ),
    EconomicLensProfile(
        lens_code="PROSPERITY_LEVEL",
        lens_display_name="Niveau de prospérité",
        indicator_code="NY.GDP.PCAP.CD",
        why_it_matters="Tient compte de la taille de la population pour donner un signal de production par habitant plus significatif.",
    ),
    EconomicLensProfile(
        lens_code="GROWTH_MOMENTUM",
        lens_display_name="Dynamique de croissance",
        indicator_code="NY.GDP.MKTP.KD.ZG",
        why_it_matters="Indique si l'économie régionale se développe, stagne ou se contracte en termes réels.",
    ),
    EconomicLensProfile(
        lens_code="PRICE_PRESSURE",
        lens_display_name="Pression des prix",
        indicator_code="FP.CPI.TOTL.ZG",
        why_it_matters="Met en évidence l'intensité de la pression sur les prix à la consommation dans la région ou sur le continent.",
    ),
    EconomicLensProfile(
        lens_code="LABOR_STRESS",
        lens_display_name="Tension du marché du travail",
        indicator_code="SL.UEM.TOTL.ZS",
        why_it_matters="Indique si le sous-emploi constitue un frein pour les ménages et l'activité économique.",
    ),
    EconomicLensProfile(
        lens_code="EXTERNAL_BALANCE",
        lens_display_name="Balance extérieure",
        indicator_code="BN.CAB.XOKA.GD.ZS",
        why_it_matters="Permet d'identifier si la région se finance à l'extérieur ou dispose d'une balance résiliente.",
    ),
    EconomicLensProfile(
        lens_code="HEALTH_EXPENDITURE",
        lens_display_name="Dépenses de santé",
        indicator_code="SH.XPD.CHEX.GD.ZS",
        why_it_matters="Révèle la part des ressources nationales consacrée à la santé publique — un signal clé de l'investissement humain et de la résilience sanitaire.",
    ),
    EconomicLensProfile(
        lens_code="LIFE_EXPECTANCY",
        lens_display_name="Espérance de vie",
        indicator_code="SP.DYN.LE00.IN",
        why_it_matters="Synthèse de la qualité du système de santé, du niveau de vie et de l'accès aux soins — un indicateur central de développement humain.",
    ),
    EconomicLensProfile(
        lens_code="FISCAL_HEALTH",
        lens_display_name="Santé budgétaire",
        indicator_code="GC.DOD.TOTL.GD.ZS",
        why_it_matters="La dette publique en % du PIB indique la marge de manœuvre budgétaire de l'État et sa capacité à absorber les chocs sans déstabiliser les finances publiques.",
    ),
    EconomicLensProfile(
        lens_code="TRADE_OPENNESS",
        lens_display_name="Ouverture commerciale",
        indicator_code="NE.EXP.GNFS.ZS",
        why_it_matters="Un haut niveau d'exportations signale une économie intégrée au commerce mondial, corrélée à une meilleure gouvernance et à une plus grande stabilité institutionnelle.",
    ),
    EconomicLensProfile(
        lens_code="CHILD_HEALTH",
        lens_display_name="Santé infantile",
        indicator_code="SP.DYN.IMRT.IN",
        why_it_matters="La mortalité infantile est un indicateur synthétique de la qualité du système de santé, de l'accès aux soins et des conditions sanitaires — validé par l'OMS et l'UNICEF comme proxy de développement humain.",
    ),
    EconomicLensProfile(
        lens_code="FISCAL_CAPACITY",
        lens_display_name="Capacité fiscale",
        indicator_code="GC.REV.TOTL.GD.ZS",
        why_it_matters="Les revenus publics en % du PIB mesurent la capacité de l'État à financer les services publics et à absorber les chocs sans recourir à l'endettement — croisé entre Banque Mondiale et FMI WEO.",
    ),
    EconomicLensProfile(
        lens_code="INVESTMENT_MOMENTUM",
        lens_display_name="Dynamique d'investissement",
        indicator_code="NE.GDI.FTOT.ZS",
        why_it_matters="La formation brute de capital fixe en % du PIB mesure l'intensité de l'investissement productif — signal de dynamisme économique et de création future de capacité.",
    ),
    EconomicLensProfile(
        lens_code="FDI_ATTRACTIVENESS",
        lens_display_name="Attractivité aux IDE",
        indicator_code="BX.KLT.DINV.WD.GD.ZS",
        why_it_matters="Les investissements directs étrangers nets signalent la confiance des investisseurs internationaux dans la stabilité institutionnelle, la compétitivité et le potentiel de croissance.",
    ),
    EconomicLensProfile(
        lens_code="LABOR_PARTICIPATION",
        lens_display_name="Participation au marché du travail",
        indicator_code="SL.TLF.CACT.ZS",
        why_it_matters="Le taux d'activité révèle la proportion de la population qui travaille ou cherche activement un emploi — un signal de la vitalité du marché du travail au-delà du simple taux de chômage.",
    ),
    EconomicLensProfile(
        lens_code="SOCIAL_INEQUALITY",
        lens_display_name="Inégalités sociales",
        indicator_code="SI.POV.GINI",
        why_it_matters="L'indice de Gini mesure la répartition des revenus — un signal de cohésion sociale, de tension politique potentielle et d'équité dans l'accès aux opportunités économiques.",
    ),
    EconomicLensProfile(
        lens_code="EDUCATION_INVESTMENT",
        lens_display_name="Investissement éducatif",
        indicator_code="SE.XPD.TOTL.GD.ZS",
        why_it_matters="Les dépenses publiques d'éducation en % du PIB reflètent l'investissement dans le capital humain — déterminant de la productivité future et de la résilience économique à long terme.",
    ),
    EconomicLensProfile(
        lens_code="DIGITAL_CONNECTIVITY",
        lens_display_name="Connectivité numérique",
        indicator_code="IT.NET.USER.ZS",
        why_it_matters="La pénétration d'Internet signale le niveau de modernisation de l'économie, l'accès à l'information et le potentiel de croissance de l'économie numérique.",
    ),
    EconomicLensProfile(
        lens_code="RULE_OF_LAW",
        lens_display_name="État de droit",
        indicator_code="RL.EST",
        why_it_matters="Mesure dans quelle mesure les agents respectent les règles de la société — contrats, droits de propriété, police, justice. Score WGI de -2,5 (faible) à +2,5 (fort).",
    ),
    EconomicLensProfile(
        lens_code="CORRUPTION_CONTROL",
        lens_display_name="Contrôle de la corruption",
        indicator_code="CC.EST",
        why_it_matters="Évalue la perception du détournement du pouvoir public à des fins privées. La corruption érode la confiance institutionnelle, freine l'investissement et aggrave les inégalités.",
    ),
    EconomicLensProfile(
        lens_code="GOVT_EFFECTIVENESS",
        lens_display_name="Efficacité du gouvernement",
        indicator_code="GE.EST",
        why_it_matters="Qualité des services publics, de la fonction publique, de l'élaboration des politiques et crédibilité de l'exécution — déterminant de la confiance institutionnelle.",
    ),
    EconomicLensProfile(
        lens_code="POLITICAL_STABILITY",
        lens_display_name="Stabilité politique",
        indicator_code="PV.EST",
        why_it_matters="Probabilité perçue de déstabilisation du gouvernement par des moyens inconstitutionnels ou violents, incluant le terrorisme. Signal clé pour l'investissement étranger.",
    ),
    EconomicLensProfile(
        lens_code="VOICE_ACCOUNTABILITY",
        lens_display_name="Voix & responsabilité",
        indicator_code="VA.EST",
        why_it_matters="Mesure la participation citoyenne à la sélection du gouvernement, la liberté d'expression, d'association et de presse — proxy de la légitimité démocratique.",
    ),
    EconomicLensProfile(
        lens_code="REGULATORY_QUALITY",
        lens_display_name="Qualité réglementaire",
        indicator_code="RQ.EST",
        why_it_matters="Capacité du gouvernement à formuler des régulations favorables au secteur privé, réduisant les barrières à l'entrée et soutenant la compétitivité.",
    ),
    EconomicLensProfile(
        lens_code="HUMAN_DEVELOPMENT",
        lens_display_name="Développement humain",
        indicator_code="WHV.HDR.HDI.INDEX",
        why_it_matters="L'IDH synthétise santé (espérance de vie), éducation (années de scolarité) et revenu (RNB/habitant PPP) — référence mondiale PNUD depuis 1990.",
    ),
    EconomicLensProfile(
        lens_code="GENDER_INEQUALITY",
        lens_display_name="Inégalité de genre",
        indicator_code="WHV.HDR.GII.INDEX",
        why_it_matters="Mesure les inégalités de genre en santé reproductive, représentation politique et participation au marché du travail. 0 = égalité parfaite, 1 = inégalité maximale.",
    ),
    # Secteurs économiques
    EconomicLensProfile(
        lens_code="AGRI_SHARE",
        lens_display_name="Part de l'agriculture",
        indicator_code="NV.AGR.TOTL.ZS",
        why_it_matters="La part de l'agriculture dans le PIB révèle la structure économique du pays — une part élevée indique souvent une économie à faible industrialisation mais une sécurité alimentaire potentiellement plus forte.",
    ),
    EconomicLensProfile(
        lens_code="INDUSTRY_SHARE",
        lens_display_name="Part de l'industrie",
        indicator_code="NV.IND.TOTL.ZS",
        why_it_matters="La part de l'industrie dans le PIB mesure la capacité de transformation et la maturité industrielle — déterminant de la productivité et de la compétitivité à l'export.",
    ),
    EconomicLensProfile(
        lens_code="SERVICES_SHARE",
        lens_display_name="Part des services",
        indicator_code="NV.SRV.TOTL.ZS",
        why_it_matters="La part des services reflète le niveau de tertiarisation de l'économie — corrélée à un PIB par habitant plus élevé et à une économie de la connaissance.",
    ),
    # Éducation & infrastructure
    EconomicLensProfile(
        lens_code="LITERACY_RATE",
        lens_display_name="Taux d'alphabétisation",
        indicator_code="SE.ADT.LITR.ZS",
        why_it_matters="L'alphabétisation adulte est la base du capital humain — elle conditionne la participation productive à l'économie formelle et l'accès aux services publics.",
    ),
    EconomicLensProfile(
        lens_code="ELECTRICITY_ACCESS",
        lens_display_name="Accès à l'électricité",
        indicator_code="EG.ELC.ACCS.ZS",
        why_it_matters="L'accès à l'électricité est une infrastructure fondamentale pour l'industrialisation, l'éducation et les soins de santé — proxy clé du développement infrastructurel.",
    ),
    EconomicLensProfile(
        lens_code="WATER_ACCESS",
        lens_display_name="Accès à l'eau potable",
        indicator_code="SH.H2O.BASW.ZS",
        why_it_matters="L'accès à une eau sûre est un droit fondamental et un déterminant direct de la santé publique — étroitement lié à la mortalité infantile et à la productivité.",
    ),
    EconomicLensProfile(
        lens_code="MILITARY_SPENDING",
        lens_display_name="Dépenses militaires",
        indicator_code="MS.MIL.XPND.GD.ZS",
        why_it_matters="La part du PIB consacrée à la défense reflète les priorités budgétaires et les perceptions du risque sécuritaire — des niveaux excessifs peuvent évincer les investissements sociaux.",
    ),
    # Sécurité publique (UNODC/UNSD SDG)
    EconomicLensProfile(
        lens_code="SAFETY_HOMICIDE",
        lens_display_name="Taux d'homicides (UNODC)",
        indicator_code="WHV.SAFETY.HOMICIDE.RATE.P100K",
        why_it_matters="Le taux d'homicides intentionnels est un proxy universel de la sécurité publique — indicateur ODD 16.1.1, il mesure l'environnement sécuritaire et impacte directement l'attractivité économique et la qualité de vie.",
    ),
    # Finance & banque centrale (BIS)
    EconomicLensProfile(
        lens_code="CENTRAL_BANK_RATE",
        lens_display_name="Taux directeur (BIS)",
        indicator_code="WHV.BIS.CBPOL.RATE",
        why_it_matters="Le taux directeur de la banque centrale détermine le coût du crédit dans l'économie — signal de politique monétaire et d'environnement d'emprunt pour les entreprises et les ménages.",
    ),
    EconomicLensProfile(
        lens_code="PRIVATE_CREDIT",
        lens_display_name="Crédit privé / PIB (BIS)",
        indicator_code="WHV.BIS.CREDIT.PRIVATE.GDP",
        why_it_matters="Le crédit accordé au secteur privé en % du PIB mesure la profondeur du système financier — un niveau élevé soutient l'investissement mais peut signaler un risque de surendettement.",
    ),
    # Réserves & monnaie (IMF IFS)
    EconomicLensProfile(
        lens_code="FX_RESERVES",
        lens_display_name="Réserves de change (IFS)",
        indicator_code="WHV.IFS.RESERVES.XAU.USD",
        why_it_matters="Les réserves de change et d'or mesurent la capacité de la banque centrale à défendre la monnaie nationale, honorer les dettes extérieures et amortir les chocs de balance des paiements.",
    ),
    EconomicLensProfile(
        lens_code="BROAD_MONEY",
        lens_display_name="Monnaie large / PIB (IFS)",
        indicator_code="WHV.IFS.BROAD.MONEY.GDP",
        why_it_matters="La monnaie large (M2/M3) en % du PIB mesure la profondeur financière et la liquidité de l'économie — un niveau élevé peut signaler soit un système financier développé, soit une politique monétaire accommodante.",
    ),
    # UNAIDS — santé mondiale
    EconomicLensProfile(
        lens_code="HIV_PREVALENCE",
        lens_display_name="Prévalence VIH (ONUSIDA)",
        indicator_code="WHV.UNAIDS.HIV.PREVALENCE.ADULT",
        why_it_matters="La prévalence du VIH chez les adultes est un indicateur clé de charge sanitaire — elle impacte la productivité, l'espérance de vie et les dépenses de santé publique.",
    ),
    EconomicLensProfile(
        lens_code="ART_COVERAGE",
        lens_display_name="Couverture ARV (ONUSIDA)",
        indicator_code="WHV.UNAIDS.ART.COVERAGE",
        why_it_matters="La couverture du traitement antirétroviral mesure la capacité du système de santé à répondre à l'épidémie VIH — un signal clé d'accès aux soins.",
    ),
    # Scolarisation (WB)
    EconomicLensProfile(
        lens_code="PRIMARY_ENROLLMENT",
        lens_display_name="Scolarisation primaire",
        indicator_code="SE.PRM.NENR",
        why_it_matters="Le taux net de scolarisation primaire mesure l'accès effectif des enfants en âge scolaire à l'éducation de base — fondement du capital humain futur.",
    ),
    EconomicLensProfile(
        lens_code="SECONDARY_ENROLLMENT",
        lens_display_name="Scolarisation secondaire",
        indicator_code="SE.SEC.NENR",
        why_it_matters="Le taux net de scolarisation secondaire indique dans quelle mesure les adolescents poursuivent leur formation — prédicteur de la productivité future et de la mobilité sociale.",
    ),
    # Assainissement, ruralité, terres (WB)
    EconomicLensProfile(
        lens_code="SANITATION_ACCESS",
        lens_display_name="Accès à l'assainissement",
        indicator_code="SH.STA.BASS.ZS",
        why_it_matters="L'accès aux sanitaires est un déterminant direct de la santé publique — il conditionne la mortalité infantile, la productivité et la dignité humaine.",
    ),
    EconomicLensProfile(
        lens_code="RURAL_POPULATION",
        lens_display_name="Population rurale",
        indicator_code="SP.RUR.TOTL.ZS",
        why_it_matters="La part de la population vivant en milieu rural détermine les besoins en infrastructure, la structure économique et les enjeux de l'urbanisation.",
    ),
    EconomicLensProfile(
        lens_code="ARABLE_LAND",
        lens_display_name="Terres arables",
        indicator_code="AG.LND.ARBL.ZS",
        why_it_matters="La proportion de terres arables révèle le potentiel agricole du pays — signal de sécurité alimentaire et de capacité d'exportation de produits primaires.",
    ),
    # ECB — Banque centrale européenne
    EconomicLensProfile(
        lens_code="ECB_HICP",
        lens_display_name="Inflation HICP (BCE)",
        indicator_code="WHV.ECB.HICP.ANNUAL",
        why_it_matters="L'IPCH (indice harmonisé des prix à la consommation) de la BCE est la mesure de référence européenne de l'inflation — comparable entre tous les pays de l'UE/UEM.",
    ),
    EconomicLensProfile(
        lens_code="ECB_BOND_YIELD",
        lens_display_name="Taux souverain 10 ans (BCE)",
        indicator_code="WHV.ECB.BOND.YIELD.10Y",
        why_it_matters="Le rendement des obligations souveraines à 10 ans reflète la prime de risque pays et le coût de financement à long terme de l'État — signal clé des marchés obligataires européens.",
    ),
    # UNCTAD
    EconomicLensProfile(
        lens_code="UNCTAD_FDI",
        lens_display_name="IDE entrants (CNUCED)",
        indicator_code="WHV.UNCTAD.FDI.INFLOWS",
        why_it_matters="Les flux d'IDE entrants selon la CNUCED représentent la référence internationale en matière de statistiques d'investissement — complémentaire aux données Banque Mondiale.",
    ),
    # UNESCO UIS
    EconomicLensProfile(
        lens_code="UNESCO_OOS",
        lens_display_name="Hors école primaire (UNESCO)",
        indicator_code="WHV.UNESCO.OOS.PRIMARY",
        why_it_matters="Le taux d'enfants non scolarisés en primaire est un indicateur ODD 4 clé — mesure directe des inégalités d'accès à l'éducation fondamentale.",
    ),
    # Imports & population (WB core)
    EconomicLensProfile(
        lens_code="IMPORTS_SHARE",
        lens_display_name="Ouverture aux importations",
        indicator_code="NE.IMP.GNFS.ZS",
        why_it_matters="Les importations en % du PIB mesurent la dépendance aux biens et services étrangers — une dépendance élevée expose aux chocs externes mais peut aussi signaler une intégration commerciale profonde.",
    ),
    EconomicLensProfile(
        lens_code="POPULATION_SIZE",
        lens_display_name="Taille de la population",
        indicator_code="SP.POP.TOTL",
        why_it_matters="La population totale détermine la taille du marché intérieur, le potentiel de main-d'œuvre et l'influence géopolitique — contextuel pour l'interprétation du PIB par habitant.",
    ),
    EconomicLensProfile(
        lens_code="FISCAL_EXPENDITURE",
        lens_display_name="Dépenses publiques",
        indicator_code="GC.XPN.TOTL.GD.ZS",
        why_it_matters="Les dépenses publiques en % du PIB révèlent le rôle de l'État dans l'économie — trop faibles, elles signalent un sous-investissement dans les services ; trop élevées, un risque budgétaire.",
    ),
    EconomicLensProfile(
        lens_code="PHYSICIANS_DENSITY",
        lens_display_name="Densité médicale",
        indicator_code="SH.MED.PHYS.ZS",
        why_it_matters="Le nombre de médecins pour 1 000 habitants est un proxy direct de la capacité du système de santé — l'OMS recommande un minimum de 1 médecin / 1 000 habitants.",
    ),
    # Environnement (WB — nouveau code AR5)
    EconomicLensProfile(
        lens_code="CO2_EMISSIONS",
        lens_display_name="Émissions CO₂ par habitant",
        indicator_code="EN.GHG.CO2.PC.CE.AR5",
        why_it_matters="Les émissions de CO₂ par habitant (t CO₂e, AR5) mesurent l'empreinte carbone individuelle — signal clé de la transition énergétique et des engagements climatiques.",
    ),
)


def describe_regional_economic_lens(lens_code: str, median_value: float | None) -> tuple[EconomicLensTone, str, str]:
    if median_value is None:
        return (
            "CONTEXT",
            "Données comparables insuffisantes",
            "Les données multi-sources actuelles ne sont pas encore suffisamment riches pour décrire cette grille régionale avec confiance.",
        )

    if lens_code == "ECONOMIC_SCALE":
        if median_value >= 5_000_000_000_000:
            return (
                "CONTEXT",
                "Base économique très large",
                "La médiane régionale indique une empreinte économique agrégée très large en dollars courants.",
            )
        if median_value >= 1_000_000_000_000:
            return (
                "CONTEXT",
                "Base économique importante",
                "La médiane régionale indique une empreinte économique significative avec un poids mondial notable.",
            )
        return (
            "CONTEXT",
            "Échelle économique plus limitée",
            "La médiane régionale indique une base économique agrégée plus modeste en dollars absolus.",
        )

    if lens_code == "PROSPERITY_LEVEL":
        if median_value >= 40_000:
            return (
                "POSITIVE",
                "Production par habitant élevée",
                "Le PIB par habitant médian suggère un niveau de prospérité comparativement élevé parmi les pays comparables.",
            )
        if median_value >= 20_000:
            return (
                "BALANCED",
                "Production par habitant moyenne-haute",
                "Le PIB par habitant médian suggère une base de prospérité significative, avec toutefois une marge d'amélioration structurelle.",
            )
        if median_value >= 8_000:
            return (
                "WATCH",
                "Production par habitant intermédiaire",
                "Le PIB par habitant médian suggère un profil de prospérité mixte avec une résilience inégale selon les pays membres.",
            )
        return (
            "STRESS",
            "Production par habitant faible",
            "Le PIB par habitant médian reste relativement faible, ce qui peut amplifier la vulnérabilité aux chocs extérieurs.",
        )

    if lens_code == "GROWTH_MOMENTUM":
        if median_value >= 4:
            return (
                "POSITIVE",
                "Expansion forte",
                "La croissance réelle du PIB régional avance à un rythme soutenu parmi les pays comparables.",
            )
        if median_value >= 2:
            return (
                "BALANCED",
                "Expansion saine",
                "La croissance réelle du PIB régional indique une expansion globalement résiliente plutôt qu'une stagnation.",
            )
        if median_value >= 0:
            return (
                "WATCH",
                "Croissance faible",
                "La croissance régionale reste positive, mais son élan est suffisamment faible pour justifier une surveillance accrue.",
            )
        return (
            "STRESS",
            "Risque de contraction",
            "La croissance réelle du PIB régional est négative, indiquant une pression contractionnelle dans les pays comparables.",
        )

    if lens_code == "PRICE_PRESSURE":
        if median_value <= 3:
            return (
                "POSITIVE",
                "Inflation maîtrisée",
                "La pression sur les prix à la consommation semble maîtrisée à l'échelle régionale, ce qui soutient la visibilité dans la planification.",
            )
        if median_value <= 6:
            return (
                "WATCH",
                "Inflation élevée",
                "L'inflation est encore gérable, mais elle est suffisamment élevée pour éroder les marges et le pouvoir d'achat des ménages.",
            )
        return (
            "STRESS",
            "Forte pression inflationniste",
            "L'inflation régionale est suffisamment élevée pour signaler une pression réelle sur les coûts, les politiques économiques et l'accessibilité.",
        )

    if lens_code == "LABOR_STRESS":
        if median_value <= 5:
            return (
                "POSITIVE",
                "Marché du travail tendu",
                "Le chômage médian est faible, ce qui suggère un sous-emploi relativement limité.",
            )
        if median_value <= 8:
            return (
                "BALANCED",
                "Chômage gérable",
                "Le chômage médian reste dans une fourchette gérable, même si le marché du travail n'est pas particulièrement tendu.",
            )
        if median_value <= 12:
            return (
                "WATCH",
                "Sous-emploi visible",
                "Le chômage médian est suffisamment élevé pour révéler un sous-emploi visible et peser sur la résilience des revenus des ménages.",
            )
        return (
            "STRESS",
            "Stress du marché du travail",
            "Le chômage médian est matériellement élevé et pèse sur la résilience, la demande et la stabilité sociale.",
        )

    if lens_code == "EXTERNAL_BALANCE":
        if median_value >= 2:
            return (
                "POSITIVE",
                "Excédent extérieur tampon",
                "La médiane du compte courant suggère un excédent extérieur qui peut contribuer à absorber les chocs.",
            )
        if median_value >= -2:
            return (
                "BALANCED",
                "Position extérieure globalement équilibrée",
                "La médiane du compte courant est proche de l'équilibre, ce qui réduit la pression immédiate sur le financement extérieur.",
            )
        if median_value >= -5:
            return (
                "WATCH",
                "Déficit extérieur notable",
                "La région enregistre un déficit extérieur qui reste gérable mais doit être surveillé.",
            )
        return (
            "STRESS",
            "Pression sur le financement extérieur",
            "La médiane du compte courant indique un déficit important et une dépendance croissante au financement extérieur.",
        )

    if lens_code == "HEALTH_EXPENDITURE":
        if median_value >= 8:
            return (
                "POSITIVE",
                "Investissement santé élevé",
                "La région consacre une part significative de son PIB à la santé, signal d'un engagement fort envers la résilience sanitaire.",
            )
        if median_value >= 5:
            return (
                "BALANCED",
                "Investissement santé modéré",
                "Les dépenses de santé sont dans la moyenne mondiale, offrant une couverture correcte sans garantir l'excellence systémique.",
            )
        return (
            "WATCH",
            "Investissement santé limité",
            "La part du PIB allouée à la santé reste faible, ce qui peut fragiliser la résilience sanitaire face aux chocs.",
        )

    if lens_code == "LIFE_EXPECTANCY":
        if median_value >= 78:
            return (
                "POSITIVE",
                "Espérance de vie élevée",
                "La médiane régionale d'espérance de vie reflète un système de santé performant et de bonnes conditions de vie.",
            )
        if median_value >= 70:
            return (
                "BALANCED",
                "Espérance de vie dans la moyenne",
                "L'espérance de vie est dans la fourchette mondiale médiane, indiquant des progrès réels mais encore des marges d'amélioration.",
            )
        return (
            "STRESS",
            "Espérance de vie préoccupante",
            "L'espérance de vie reste faible, signalant des fragilités structurelles dans l'accès aux soins et les conditions de vie.",
        )

    if lens_code == "FISCAL_HEALTH":
        if median_value <= 40:
            return (
                "POSITIVE",
                "Espace budgétaire solide",
                "La dette publique médiane reste modérée, préservant la capacité d'action de l'État face aux chocs.",
            )
        if median_value <= 70:
            return (
                "BALANCED",
                "Dette publique gérable",
                "La dette publique est dans une fourchette gérable, même si l'espace fiscal reste à surveiller.",
            )
        if median_value <= 100:
            return (
                "WATCH",
                "Endettement public notable",
                "La dette publique est suffisamment élevée pour réduire les marges de manœuvre budgétaire en cas de choc.",
            )
        return (
            "STRESS",
            "Pression budgétaire forte",
            "Le niveau d'endettement public dépasse les repères de soutenabilité et limite la capacité de réponse de l'État.",
        )

    if lens_code == "TRADE_OPENNESS":
        if median_value >= 35:
            return (
                "POSITIVE",
                "Économie très ouverte",
                "Le niveau d'exportations indique une intégration forte au commerce mondial, signal de compétitivité et de gouvernance solide.",
            )
        if median_value >= 20:
            return (
                "BALANCED",
                "Ouverture commerciale modérée",
                "L'économie est modérément intégrée au commerce mondial, avec une exposition limitée mais non négligeable aux chocs extérieurs.",
            )
        return (
            "WATCH",
            "Faible ouverture commerciale",
            "Le faible niveau d'exportations suggère une économie peu intégrée au commerce mondial, ce qui peut limiter la croissance et la résilience.",
        )

    if lens_code == "CHILD_HEALTH":
        if median_value <= 10:
            return (
                "POSITIVE",
                "Mortalité infantile faible",
                "La médiane régionale de mortalité infantile reflète un système de santé performant et un accès étendu aux soins périnataux.",
            )
        if median_value <= 30:
            return (
                "BALANCED",
                "Mortalité infantile modérée",
                "Le niveau de mortalité infantile est dans une fourchette moyenne mondiale — des marges d'amélioration significatives existent.",
            )
        if median_value <= 60:
            return (
                "WATCH",
                "Mortalité infantile élevée",
                "La mortalité infantile reste élevée, signalant des fragilités dans l'accès aux soins de santé maternelle et néonatale.",
            )
        return (
            "STRESS",
            "Mortalité infantile critique",
            "Le niveau de mortalité infantile est très élevé — indicateur de défaillances systémiques dans la couverture sanitaire.",
        )

    if lens_code == "FISCAL_CAPACITY":
        if median_value >= 35:
            return (
                "POSITIVE",
                "Capacité fiscale solide",
                "Des revenus publics élevés en % du PIB permettent de financer des services publics de qualité et de maintenir une capacité d'amortissement des chocs.",
            )
        if median_value >= 22:
            return (
                "BALANCED",
                "Capacité fiscale correcte",
                "Les revenus publics sont dans la norme mondiale, offrant une marge de manœuvre budgétaire sans garantir une capacité d'investissement exceptionnelle.",
            )
        return (
            "WATCH",
            "Capacité fiscale limitée",
            "Des revenus publics faibles contraignent la capacité à financer les infrastructures, les services de santé et l'éducation sans recourir à l'endettement.",
        )

    if lens_code == "INVESTMENT_MOMENTUM":
        if median_value >= 28:
            return (
                "POSITIVE",
                "Investissement soutenu",
                "La formation brute de capital fixe est élevée, signalant un dynamisme d'investissement productif favorable à la croissance future.",
            )
        if median_value >= 20:
            return (
                "BALANCED",
                "Investissement dans la norme",
                "Le niveau d'investissement est cohérent avec la moyenne mondiale — suffisant pour maintenir le stock de capital sans dynamisme exceptionnel.",
            )
        return (
            "WATCH",
            "Investissement insuffisant",
            "La formation brute de capital fixe est faible, ce qui peut contraindre la croissance potentielle à moyen terme.",
        )

    if lens_code == "FDI_ATTRACTIVENESS":
        if median_value >= 4:
            return (
                "POSITIVE",
                "Forte attractivité aux IDE",
                "Des flux élevés d'investissements directs étrangers reflètent la confiance des investisseurs internationaux et soutiennent le transfert de technologie.",
            )
        if median_value >= 1.5:
            return (
                "BALANCED",
                "Attractivité modérée aux IDE",
                "Les flux d'IDE sont présents mais limités — l'environnement institutionnel ou la compétitivité freine l'attractivité maximale.",
            )
        return (
            "WATCH",
            "Faible attractivité aux IDE",
            "Les flux d'IDE restent très limités, ce qui peut refléter une instabilité institutionnelle, des barrières réglementaires ou un manque de compétitivité.",
        )

    if lens_code == "LABOR_PARTICIPATION":
        if median_value >= 62:
            return (
                "POSITIVE",
                "Marché du travail très actif",
                "Un taux d'activité élevé signale une main-d'œuvre engagée et une économie avec une base productive large.",
            )
        if median_value >= 54:
            return (
                "BALANCED",
                "Participation au travail normale",
                "Le taux d'activité est dans la norme mondiale — sans signal particulier de sous-utilisation ou d'exclusion structurelle du marché du travail.",
            )
        return (
            "WATCH",
            "Sous-participation au marché du travail",
            "Un faible taux d'activité peut refléter des inégalités de genre, des contraintes économiques ou un vieillissement accéléré de la population.",
        )

    if lens_code == "SOCIAL_INEQUALITY":
        if median_value <= 28:
            return (
                "POSITIVE",
                "Faibles inégalités",
                "Un Gini faible reflète une répartition des revenus relativement équitable, favorable à la cohésion sociale et à la résilience économique.",
            )
        if median_value <= 38:
            return (
                "BALANCED",
                "Inégalités modérées",
                "Le niveau d'inégalités est dans la fourchette mondiale médiane — présent mais sans signaler de fracture sociale extrême.",
            )
        if median_value <= 50:
            return (
                "WATCH",
                "Inégalités élevées",
                "Un Gini élevé indique une concentration significative des revenus, source potentielle de tensions sociales et de fragilité politique.",
            )
        return (
            "STRESS",
            "Inégalités très fortes",
            "Le niveau d'inégalités est parmi les plus élevés au monde — signal de fracture structurelle entre les segments de population.",
        )

    if lens_code == "EDUCATION_INVESTMENT":
        if median_value >= 5.5:
            return (
                "POSITIVE",
                "Investissement éducatif élevé",
                "Des dépenses publiques d'éducation importantes signalent un engagement fort dans le développement du capital humain.",
            )
        if median_value >= 3.5:
            return (
                "BALANCED",
                "Investissement éducatif dans la norme",
                "Les dépenses d'éducation sont dans la fourchette internationale standard — suffisantes mais sans position de leader.",
            )
        return (
            "WATCH",
            "Investissement éducatif limité",
            "De faibles dépenses publiques d'éducation peuvent compromettre la qualité du capital humain et la productivité future.",
        )

    if lens_code == "DIGITAL_CONNECTIVITY":
        if median_value >= 80:
            return (
                "POSITIVE",
                "Économie très connectée",
                "Une pénétration d'Internet élevée reflète un niveau de modernisation avancé et un potentiel significatif pour l'économie numérique.",
            )
        if median_value >= 55:
            return (
                "BALANCED",
                "Connectivité en progression",
                "La pénétration d'Internet est dans la fourchette médiane mondiale — en progression mais avec encore une part non connectée de la population.",
            )
        return (
            "WATCH",
            "Connectivité numérique limitée",
            "Une faible pénétration d'Internet signale une fracture numérique susceptible de limiter la participation à l'économie mondiale.",
        )

    if lens_code in ("RULE_OF_LAW", "CORRUPTION_CONTROL", "GOVT_EFFECTIVENESS", "POLITICAL_STABILITY", "VOICE_ACCOUNTABILITY", "REGULATORY_QUALITY"):
        if median_value >= 0.75:
            return ("POSITIVE", "Gouvernance solide", "La médiane régionale WGI indique une bonne qualité institutionnelle, favorisant la stabilité et la confiance des investisseurs.")
        if median_value >= 0.0:
            return ("BALANCED", "Gouvernance correcte", "La médiane régionale WGI est légèrement positive — qualité institutionnelle acceptable mais avec des marges d'amélioration.")
        if median_value >= -0.75:
            return ("WATCH", "Gouvernance fragile", "La médiane régionale WGI est en territoire négatif — signal de fragilité institutionnelle à surveiller pour les risques pays.")
        return ("STRESS", "Déficit de gouvernance", "La médiane régionale WGI indique des institutions structurellement faibles — risque accru pour l'investissement et la résilience.")

    if lens_code == "HUMAN_DEVELOPMENT":
        if median_value >= 0.800:
            return ("POSITIVE", "Développement humain élevé", "La médiane régionale IDH dépasse le seuil ONU de développement humain élevé (≥ 0,800).")
        if median_value >= 0.600:
            return ("BALANCED", "Développement humain moyen", "La médiane régionale IDH est dans la fourchette ONU de développement humain moyen (0,600–0,799).")
        if median_value >= 0.400:
            return ("WATCH", "Développement humain faible", "La médiane régionale IDH est dans la fourchette basse (0,400–0,599) — déficits en santé, éducation ou revenu.")
        return ("STRESS", "Développement humain très faible", "La médiane régionale IDH est en dessous de 0,400 — signal de vulnérabilité structurelle prononcée.")

    if lens_code == "GENDER_INEQUALITY":
        if median_value <= 0.15:
            return ("POSITIVE", "Très faibles inégalités de genre", "La médiane régionale GII indique une forte égalité de genre en santé reproductive, représentation et emploi.")
        if median_value <= 0.35:
            return ("BALANCED", "Inégalités de genre modérées", "La médiane régionale GII reste dans un registre modéré — progrès notables mais des écarts subsistent.")
        if median_value <= 0.55:
            return ("WATCH", "Inégalités de genre significatives", "La médiane régionale GII indique des inégalités substantielles pouvant freiner le développement humain et économique.")
        return ("STRESS", "Inégalités de genre fortes", "La médiane régionale GII dépasse 0,55 — signal de fortes disparités structurelles entre les genres.")

    if lens_code == "AGRI_SHARE":
        if median_value >= 20:
            return ("WATCH", "Économie à dominante agricole", "Une part élevée de l'agriculture dans le PIB régional signale une économie peu diversifiée, sensible aux aléas climatiques et aux fluctuations des prix alimentaires.")
        if median_value >= 8:
            return ("BALANCED", "Agriculture significative", "L'agriculture représente une part notable mais non dominante du PIB — profil d'économie en transition vers l'industrie et les services.")
        return ("POSITIVE", "Économie tertiarisée / industrialisée", "Une faible part agricole indique une diversification avancée vers l'industrie et les services.")

    if lens_code == "INDUSTRY_SHARE":
        if median_value >= 35:
            return ("POSITIVE", "Forte base industrielle", "La médiane régionale indique une économie industriellement développée, avec une capacité de transformation et d'export significative.")
        if median_value >= 20:
            return ("BALANCED", "Industrialisation modérée", "Le niveau d'industrie est dans la norme mondiale — une diversification en cours mais sans dominance sectorielle marquée.")
        return ("WATCH", "Faible industrialisation", "Une part industrielle limitée peut signaler une dépendance aux matières premières et une vulnérabilité aux chocs de valeur ajoutée.")

    if lens_code == "SERVICES_SHARE":
        if median_value >= 60:
            return ("POSITIVE", "Économie de services avancée", "Une part des services élevée dans le PIB reflète une économie mature, orientée connaissance et valeur ajoutée immatérielle.")
        if median_value >= 45:
            return ("BALANCED", "Services en développement", "La part des services est dans la fourchette mondiale médiane — économie en transition entre industrie et tertiarisation.")
        return ("WATCH", "Faible part des services", "Une économie peu tertiarisée peut indiquer un stade de développement précoce ou une dépendance aux secteurs primaires.")

    if lens_code == "LITERACY_RATE":
        if median_value >= 95:
            return ("POSITIVE", "Alphabétisation quasi universelle", "Un taux d'alphabétisation médian très élevé reflète un capital humain de base solide et une capacité de participation pleine à l'économie formelle.")
        if median_value >= 80:
            return ("BALANCED", "Alphabétisation correcte", "Le taux d'alphabétisation est dans une fourchette correcte — significatif mais avec encore une part non alphabétisée.")
        return ("STRESS", "Déficit d'alphabétisation", "Un taux d'alphabétisation faible signale un déficit structurel de capital humain, frein majeur à la productivité et au développement.")

    if lens_code == "ELECTRICITY_ACCESS":
        if median_value >= 95:
            return ("POSITIVE", "Accès universel à l'électricité", "L'accès à l'électricité est quasi-universel — infrastructure de base disponible pour la quasi-totalité de la population.")
        if median_value >= 70:
            return ("BALANCED", "Accès en cours d'universalisation", "L'accès à l'électricité est majoritaire mais une fraction de la population reste sans accès, limitant les opportunités économiques.")
        return ("STRESS", "Déficit d'accès à l'électricité", "Un accès à l'électricité limité est un frein majeur à l'industrialisation, à l'éducation et aux soins de santé.")

    if lens_code == "WATER_ACCESS":
        if median_value >= 95:
            return ("POSITIVE", "Accès quasi universel à l'eau potable", "La quasi-totalité de la population a accès à une source d'eau améliorée — base sanitaire solide.")
        if median_value >= 75:
            return ("BALANCED", "Accès majoritaire à l'eau potable", "L'accès à l'eau potable est majoritaire mais des gaps subsistent dans certaines zones rurales ou fragiles.")
        return ("STRESS", "Déficit d'accès à l'eau potable", "Un accès limité à l'eau potable est un facteur de risque sanitaire majeur, directement lié à la mortalité infantile et aux maladies évitables.")

    if lens_code == "MILITARY_SPENDING":
        if median_value >= 4:
            return ("WATCH", "Dépenses militaires élevées", "Un niveau élevé de dépenses militaires peut signaler des tensions sécuritaires régionales et un risque d'éviction des dépenses sociales.")
        if median_value >= 2:
            return ("BALANCED", "Dépenses militaires modérées", "Le niveau de dépenses militaires est dans la norme mondiale — sans signaler de surcharge budgétaire ou d'urgence sécuritaire.")
        return ("POSITIVE", "Dépenses militaires contenues", "De faibles dépenses militaires permettent de préserver l'espace budgétaire pour les investissements sociaux et économiques.")

    if lens_code == "CENTRAL_BANK_RATE":
        if median_value <= 2:
            return ("POSITIVE", "Politique monétaire accommodante", "Un taux directeur très bas signale une politique monétaire accommodante, favorable au crédit et à l'investissement.")
        if median_value <= 6:
            return ("BALANCED", "Taux directeur dans la norme", "Le taux directeur est dans une fourchette neutre — ni particulièrement restrictif ni particulièrement stimulant.")
        if median_value <= 12:
            return ("WATCH", "Politique monétaire restrictive", "Un taux directeur élevé reflète une lutte contre l'inflation ou une défense de la monnaie — coût du crédit plus lourd.")
        return ("STRESS", "Taux directeur très élevé", "Un taux directeur très élevé signale une pression inflationniste sévère ou une crise de confiance monétaire.")

    if lens_code == "PRIVATE_CREDIT":
        if median_value >= 100:
            return ("POSITIVE", "Système financier très développé", "Un crédit privé supérieur au PIB reflète un secteur financier profond, mais peut aussi signaler un risque de surendettement.")
        if median_value >= 50:
            return ("BALANCED", "Approfondissement financier correct", "Le niveau de crédit privé est dans la fourchette des économies intermédiaires — base financière opérationnelle.")
        return ("WATCH", "Sous-développement financier", "Un faible niveau de crédit privé freine l'accès des entreprises et des ménages au financement — contrainte de croissance.")

    if lens_code == "FX_RESERVES":
        return ("CONTEXT", "Réserves de change — données absolues", "Les réserves sont exprimées en milliards USD — leur interprétation nécessite une mise en regard avec les importations (mois couverts) et la dette extérieure.")

    if lens_code == "BROAD_MONEY":
        if median_value >= 100:
            return ("POSITIVE", "Système financier très liquide", "Une masse monétaire large supérieure au PIB indique un système financier profond et liquide, favorable à la mobilisation de l'épargne.")
        if median_value >= 50:
            return ("BALANCED", "Liquidité monétaire correcte", "La masse monétaire large est dans la norme des économies émergentes — système financier fonctionnel.")
        return ("WATCH", "Économie peu monétarisée", "Une faible masse monétaire relative peut signaler une économie encore peu bancarisée, limitant l'intermédiation financière.")

    if lens_code in ("ADB_GROWTH", "AFDB_GROWTH"):
        if median_value >= 4:
            return ("POSITIVE", "Expansion régionale forte", "La croissance régionale est soutenue selon la source régionale de développement — dynamisme économique confirmé.")
        if median_value >= 2:
            return ("BALANCED", "Expansion saine", "La croissance reste positive et résiliente selon la source régionale.")
        if median_value >= 0:
            return ("WATCH", "Croissance faible", "La croissance régionale peine à s'affirmer — signal de vigilance sur les fondamentaux.")
        return ("STRESS", "Contraction économique", "La source régionale confirme une pression contractionnelle sur l'économie.")

    if lens_code in ("ADB_POVERTY", "CEPAL_POVERTY", "CEPAL_EXTREME_POVERTY"):
        if median_value <= 5:
            return ("POSITIVE", "Pauvreté très faible", "Moins de 5 % de la population vit en dessous du seuil de pauvreté — résultat de politiques sociales efficaces.")
        if median_value <= 20:
            return ("BALANCED", "Pauvreté modérée", "Le taux de pauvreté est dans une fourchette gérée mais des efforts restent nécessaires pour l'inclusion économique.")
        if median_value <= 40:
            return ("WATCH", "Pauvreté élevée", "Une part significative de la population reste sous le seuil de pauvreté — contrainte majeure sur la demande intérieure et la cohésion sociale.")
        return ("STRESS", "Pauvreté très élevée", "Plus de 40 % de la population en situation de pauvreté — signal de fragilité structurelle profonde.")

    if lens_code == "HIV_PREVALENCE":
        if median_value <= 0.5:
            return ("POSITIVE", "Faible prévalence VIH", "La prévalence du VIH est inférieure à 0,5 % — impact limité sur la charge sanitaire nationale.")
        if median_value <= 2:
            return ("BALANCED", "Prévalence VIH modérée", "La prévalence du VIH est présente et nécessite des programmes de prévention et de traitement soutenus.")
        if median_value <= 5:
            return ("WATCH", "Prévalence VIH élevée", "Une prévalence du VIH significative implique une charge sanitaire et économique notable sur le système de soins.")
        return ("STRESS", "Épidémie VIH sévère", "Une prévalence supérieure à 5 % indique une épidémie sévère impactant profondément la démographie, la productivité et les finances publiques.")

    if lens_code == "ART_COVERAGE":
        if median_value >= 90:
            return ("POSITIVE", "Couverture ARV quasi universelle", "Plus de 90 % des personnes vivant avec le VIH reçoivent un traitement — signal d'un système de santé réactif et d'un financement adéquat.")
        if median_value >= 60:
            return ("BALANCED", "Couverture ARV en progrès", "La couverture ARV est significative mais encore incomplète — des gaps existent dans l'accès aux soins.")
        return ("STRESS", "Couverture ARV insuffisante", "Une faible couverture ARV signale des barrières d'accès aux soins — risque accru de transmission et de mortalité liée au VIH.")

    if lens_code == "AFDB_FDI":
        if median_value >= 4:
            return ("POSITIVE", "Forte attractivité africaine aux IDE", "Des flux d'IDE élevés en % du PIB reflètent la confiance des investisseurs étrangers dans le potentiel africain.")
        if median_value >= 1.5:
            return ("BALANCED", "Attractivité IDE modérée", "Les IDE entrants sont présents mais limités — l'environnement des affaires en amélioration progressive.")
        return ("WATCH", "Faible attractivité aux IDE", "Des flux d'IDE limités peuvent refléter des risques perçus, des barrières réglementaires ou un manque d'infrastructures.")

    if lens_code == "PRIMARY_ENROLLMENT":
        if median_value >= 95:
            return ("POSITIVE", "Scolarisation primaire quasi universelle", "Presque tous les enfants en âge d'aller à l'école primaire y sont effectivement scolarisés.")
        if median_value >= 80:
            return ("BALANCED", "Scolarisation primaire correcte", "La majorité des enfants sont scolarisés en primaire, mais une fraction non négligeable reste non scolarisée.")
        return ("STRESS", "Scolarisation primaire insuffisante", "Un taux net de scolarisation primaire faible signale des barrières d'accès — pauvreté, distance, genre — qui compromettent le développement du capital humain.")

    if lens_code == "SECONDARY_ENROLLMENT":
        if median_value >= 90:
            return ("POSITIVE", "Forte continuité scolaire", "La quasi-totalité des adolescents en âge scolaire poursuit une éducation secondaire — signal de capital humain avancé.")
        if median_value >= 65:
            return ("BALANCED", "Scolarisation secondaire modérée", "La majorité des jeunes accèdent au secondaire, avec des marges d'amélioration pour les groupes défavorisés.")
        return ("WATCH", "Abandon scolaire élevé", "Un faible taux de scolarisation secondaire indique un abandon précoce, limitant la productivité future et la mobilité sociale.")

    if lens_code == "SANITATION_ACCESS":
        if median_value >= 95:
            return ("POSITIVE", "Accès aux sanitaires quasi universel", "L'assainissement de base est disponible pour la quasi-totalité de la population — impact positif sur la santé publique.")
        if median_value >= 75:
            return ("BALANCED", "Accès à l'assainissement majoritaire", "La majorité de la population dispose de sanitaires améliorés, mais des gaps persistent dans les zones défavorisées.")
        return ("STRESS", "Déficit d'assainissement critique", "Un faible accès à l'assainissement entraîne des risques sanitaires majeurs — maladies hydriques, mortalité infantile et perte de productivité.")

    if lens_code == "RURAL_POPULATION":
        if median_value >= 60:
            return ("CONTEXT", "Économie à dominante rurale", "La majorité de la population vit en zone rurale — enjeux d'accès aux services, d'infrastructure et de transition vers l'urbanisation.")
        if median_value >= 30:
            return ("CONTEXT", "Mix urbain-rural équilibré", "La population est répartie entre zones rurales et urbaines — transition démographique en cours.")
        return ("CONTEXT", "Économie fortement urbanisée", "Une faible part de population rurale reflète une urbanisation avancée, avec des enjeux spécifiques de densification et de services urbains.")

    if lens_code == "ARABLE_LAND":
        if median_value >= 30:
            return ("POSITIVE", "Fort potentiel agricole", "Une part élevée de terres arables confère un avantage comparatif dans l'agriculture et la sécurité alimentaire.")
        if median_value >= 10:
            return ("BALANCED", "Potentiel agricole modéré", "Les terres arables représentent une part notable — base agricole opérationnelle sans être dominante.")
        return ("CONTEXT", "Terres arables limitées", "Une faible part de terres arables peut refléter une géographie contrainte (désert, montagne) — dépendance aux importations alimentaires potentielle.")

    if lens_code == "ECB_HICP":
        if median_value <= 2:
            return ("POSITIVE", "Inflation HICP dans la cible BCE", "L'inflation harmonisée est dans ou sous la cible de 2 % de la BCE — signal de stabilité des prix pour la zone euro.")
        if median_value <= 4:
            return ("WATCH", "Inflation HICP au-dessus de la cible", "L'IPCH dépasse la cible BCE de 2 % — pression sur le pouvoir d'achat et signal de resserrement monétaire potentiel.")
        return ("STRESS", "Forte pression inflationniste (BCE)", "L'IPCH est nettement au-dessus de la cible BCE — contexte de resserrement monétaire actif ou de chocs d'offre.")

    if lens_code == "ECB_BOND_YIELD":
        if median_value <= 2:
            return ("POSITIVE", "Taux souverain très faible", "Un rendement obligataire à 10 ans très bas reflète une prime de risque faible et un coût de financement public avantageux.")
        if median_value <= 4:
            return ("BALANCED", "Taux souverain normalisé", "Le rendement souverain est dans une fourchette historiquement normale — coût de financement gérable pour l'État.")
        if median_value <= 7:
            return ("WATCH", "Taux souverain sous pression", "Un rendement élevé signale une prime de risque accrue — coût de financement public plus lourd et signal de méfiance des marchés.")
        return ("STRESS", "Taux souverain en crise", "Un rendement très élevé indique une crise de confiance des marchés dans la soutenabilité de la dette souveraine.")

    if lens_code == "UNCTAD_FDI":
        if median_value >= 4:
            return ("POSITIVE", "Forte attractivité aux IDE (CNUCED)", "Des flux d'IDE élevés confirment l'attractivité internationale du pays selon la référence CNUCED.")
        if median_value >= 1.5:
            return ("BALANCED", "Attractivité IDE modérée", "Les IDE entrants sont présents selon la CNUCED — environnement des affaires fonctionnel sans attractivité maximale.")
        return ("WATCH", "Faible attractivité aux IDE (CNUCED)", "Des flux d'IDE limités selon la CNUCED peuvent refléter des risques institutionnels, des barrières ou un manque de compétitivité.")

    if lens_code == "UNESCO_OOS":
        if median_value <= 5:
            return ("POSITIVE", "Quasi-universalité scolaire primaire", "Moins de 5 % des enfants en âge primaire sont hors de l'école — ODD 4 quasi atteint.")
        if median_value <= 15:
            return ("BALANCED", "Exclusion scolaire modérée", "Entre 5 et 15 % d'enfants hors de l'école — des programmes ciblés restent nécessaires pour les populations vulnérables.")
        return ("STRESS", "Exclusion scolaire élevée", "Plus de 15 % des enfants en âge primaire sont non scolarisés — frein majeur au développement humain et à la réduction des inégalités.")

    return (
        "CONTEXT",
        "Signal contextuel",
        "Cette grille est actuellement exposée comme preuve contextuelle sans règle narrative spécifique.",
    )


def describe_country_economic_lens(
    lens_code: str,
    latest_value: float | None,
    trend_direction: str,
) -> tuple[EconomicLensTone, str, str]:
    if latest_value is None:
        return (
            "CONTEXT",
            "Données comparables insuffisantes",
            "Les données multi-sources actuelles ne sont pas encore suffisamment riches pour décrire cette grille pays avec confiance.",
        )

    if lens_code == "ECONOMIC_SCALE":
        if latest_value >= 2_000_000_000_000:
            return (
                "CONTEXT",
                "Économie nationale très large",
                "Le pays fait partie du premier quartile mondial par échelle économique absolue, ce qui change la façon dont les chocs se propagent dans le reste du profil.",
            )
        if latest_value >= 300_000_000_000:
            return (
                "CONTEXT",
                "Échelle nationale significative",
                "Le pays a suffisamment d'échelle économique pour peser à l'échelle régionale, même si la résilience dépend encore des autres indicateurs.",
            )
        return (
            "CONTEXT",
            "Échelle nationale plus limitée",
            "Le pays opère à une échelle absolue plus modeste, ce qui peut amplifier l'exposition aux chocs extérieurs et aux risques de concentration.",
        )

    if lens_code == "PROSPERITY_LEVEL":
        if latest_value >= 40_000:
            return (
                "POSITIVE",
                "Production par habitant élevée",
                "Le PIB par habitant indique une base de prospérité relativement forte, même si les inégalités et la structure des coûts restent déterminantes.",
            )
        if latest_value >= 20_000:
            return (
                "BALANCED",
                "Niveau de prospérité moyen-élevé",
                "Le PIB par habitant indique une base de prospérité significative, mais qui ne garantit pas automatiquement la résilience.",
            )
        if latest_value >= 8_000:
            return (
                "WATCH",
                "Niveau de prospérité intermédiaire",
                "Le PIB par habitant suggère un profil de prospérité mixte, susceptible de s'améliorer ou de se dégrader selon la dynamique de croissance et l'inflation.",
            )
        return (
            "STRESS",
            "Base de prospérité faible",
            "Le PIB par habitant reste relativement faible, ce qui peut amplifier la sensibilité à l'inflation et à la faiblesse du marché du travail.",
        )

    if lens_code == "GROWTH_MOMENTUM":
        if latest_value >= 4:
            return (
                "POSITIVE",
                "Expansion forte",
                "Le pays croît à un rythme réel soutenu, ce qui soutient une conjoncture économique à court terme plus solide.",
            )
        if latest_value >= 2:
            return (
                "BALANCED",
                "Expansion saine",
                "La croissance est suffisamment positive pour soutenir l'économie, mais doit encore être vérifiée par rapport à l'inflation et la balance extérieure.",
            )
        if latest_value >= 0:
            return (
                "WATCH",
                "Croissance faible",
                "La croissance reste positive mais manque de vigueur pour dissiper la fragilité économique à elle seule.",
            )
        return (
            "STRESS",
            "Signal de contraction",
            "La croissance réelle du PIB négatif indique une économie sous pression cyclique ou structurelle.",
        )

    if lens_code == "PRICE_PRESSURE":
        if latest_value <= 3:
            return (
                "POSITIVE",
                "Inflation maîtrisée",
                "L'inflation semble globalement maîtrisée, ce qui contribue à préserver le pouvoir d'achat et la visibilité dans la planification.",
            )
        if latest_value <= 6:
            return (
                "WATCH",
                "Inflation élevée",
                "L'inflation est suffisamment élevée pour affecter l'accessibilité et la planification des coûts, même si elle n'est pas encore extrême.",
            )
        return (
            "STRESS",
            "Forte pression inflationniste",
            "L'inflation est suffisamment élevée pour créer une pression réelle sur les ménages, les politiques économiques et les structures de coûts des entreprises.",
        )

    if lens_code == "LABOR_STRESS":
        if latest_value <= 5:
            return (
                "POSITIVE",
                "Marché du travail tendu",
                "Le chômage est suffisamment faible pour suggérer un sous-emploi relativement limité.",
            )
        if latest_value <= 8:
            return (
                "BALANCED",
                "Chômage gérable",
                "Le chômage reste dans une fourchette gérable, même sans signaler une forte tension du marché du travail.",
            )
        if latest_value <= 12:
            return (
                "WATCH",
                "Sous-emploi visible",
                "Le chômage est suffisamment élevé pour révéler un sous-emploi visible et peser sur la résilience des revenus des ménages.",
            )
        return (
            "STRESS",
            "Stress du marché du travail",
            "Le chômage est matériellement élevé et pèse sur la résilience, la demande et la stabilité sociale.",
        )

    if lens_code == "EXTERNAL_BALANCE":
        if latest_value >= 2:
            return (
                "POSITIVE",
                "Excédent extérieur tampon",
                "Le pays dégage un excédent extérieur qui peut contribuer à absorber les chocs et réduire la pression sur le financement.",
            )
        if latest_value >= -2:
            return (
                "BALANCED",
                "Position extérieure globalement équilibrée",
                "Le compte extérieur est proche de l'équilibre, limitant la dépendance immédiate envers le financement extérieur.",
            )
        if latest_value >= -5:
            return (
                "WATCH",
                "Déficit extérieur notable",
                "Le pays enregistre un déficit extérieur significatif qui reste gérable mais doit être surveillé de près.",
            )
        return (
            "STRESS",
            "Pression sur le financement extérieur",
            "Le déficit extérieur est assez large pour signaler une pression significative sur le financement et une vulnérabilité aux changements des flux de capitaux ou commerciaux.",
        )

    if lens_code == "HEALTH_EXPENDITURE":
        if latest_value >= 8:
            return (
                "POSITIVE",
                "Investissement santé élevé",
                "Le pays consacre une part significative de son PIB à la santé, reflet d'un engagement fort envers la couverture sanitaire et la résilience humaine.",
            )
        if latest_value >= 5:
            return (
                "BALANCED",
                "Investissement santé dans la norme",
                "Les dépenses de santé sont dans la moyenne mondiale, assurant une couverture correcte sans garantir l'excellence systémique.",
            )
        return (
            "WATCH",
            "Investissement santé insuffisant",
            "La part du PIB consacrée à la santé reste faible, ce qui peut fragiliser la résilience sanitaire et le développement humain.",
        )

    if lens_code == "LIFE_EXPECTANCY":
        if latest_value >= 78:
            return (
                "POSITIVE",
                "Espérance de vie élevée",
                "L'espérance de vie reflète un système de santé performant, de bonnes conditions de vie et un accès aux soins de qualité.",
            )
        if latest_value >= 70:
            return (
                "BALANCED",
                "Espérance de vie dans la moyenne",
                "L'espérance de vie se situe dans la fourchette mondiale médiane, indiquant des progrès réels avec encore des marges d'amélioration.",
            )
        return (
            "STRESS",
            "Espérance de vie préoccupante",
            "L'espérance de vie reste faible, signalant des fragilités structurelles dans l'accès aux soins et les conditions de vie.",
        )

    if lens_code == "FISCAL_HEALTH":
        if latest_value <= 40:
            return (
                "POSITIVE",
                "Espace budgétaire solide",
                "La dette publique reste modérée, ce qui préserve la capacité de l'État à agir en cas de choc sans déstabiliser les finances.",
            )
        if latest_value <= 70:
            return (
                "BALANCED",
                "Dette publique gérable",
                "La dette publique est dans une fourchette gérable, mais l'espace fiscal doit être surveillé pour éviter une accumulation excessive.",
            )
        if latest_value <= 100:
            return (
                "WATCH",
                "Endettement public notable",
                "Le niveau de dette publique réduit les marges de manœuvre budgétaire et peut amplifier la vulnérabilité en cas de choc.",
            )
        return (
            "STRESS",
            "Pression budgétaire forte",
            "L'endettement public dépasse les repères de soutenabilité et contraint fortement la capacité de réponse de l'État.",
        )

    if lens_code == "TRADE_OPENNESS":
        if latest_value >= 35:
            return (
                "POSITIVE",
                "Économie très ouverte",
                "Le niveau élevé d'exportations signale une intégration forte au commerce mondial, corrélée à une gouvernance solide et une meilleure stabilité institutionnelle.",
            )
        if latest_value >= 20:
            return (
                "BALANCED",
                "Ouverture commerciale modérée",
                "L'économie est modérément connectée au commerce mondial, avec une exposition aux cycles extérieurs mais aussi des bénéfices en termes de revenus.",
            )
        return (
            "WATCH",
            "Faible ouverture commerciale",
            "Le niveau d'exportations est limité, ce qui peut contraindre la croissance et réduire la résilience face aux chocs domestiques.",
        )

    if lens_code == "CHILD_HEALTH":
        if latest_value <= 10:
            return (
                "POSITIVE",
                "Mortalité infantile faible",
                "Un taux de mortalité infantile très bas reflète un accès étendu aux soins périnataux et une couverture vaccinale efficace.",
            )
        if latest_value <= 30:
            return (
                "BALANCED",
                "Mortalité infantile modérée",
                "Le taux de mortalité infantile est dans la fourchette mondiale intermédiaire — des progrès sont visibles mais des efforts restent nécessaires.",
            )
        if latest_value <= 60:
            return (
                "WATCH",
                "Mortalité infantile élevée",
                "Un niveau élevé de mortalité infantile signale des gaps dans la couverture sanitaire néonatale et maternelle qui méritent attention.",
            )
        return (
            "STRESS",
            "Mortalité infantile critique",
            "La mortalité infantile très élevée indique des défaillances systémiques dans l'accès aux soins — indicateur prioritaire de l'OMS et de l'UNICEF.",
        )

    if lens_code == "FISCAL_CAPACITY":
        if latest_value >= 35:
            return (
                "POSITIVE",
                "Capacité fiscale solide",
                "Des recettes publiques élevées permettent à l'État de financer les services collectifs et de maintenir une capacité d'amortissement des chocs.",
            )
        if latest_value >= 22:
            return (
                "BALANCED",
                "Capacité fiscale correcte",
                "Les revenus publics sont dans la norme mondiale, offrant une marge budgétaire sans conférer de capacité d'investissement exceptionnelle.",
            )
        return (
            "WATCH",
            "Capacité fiscale contrainte",
            "Des recettes publiques faibles limitent la capacité à investir dans les infrastructures et les services sans recourir à l'endettement.",
        )

    if lens_code == "INVESTMENT_MOMENTUM":
        if latest_value >= 28:
            return (
                "POSITIVE",
                "Investissement dynamique",
                "Un niveau élevé de formation brute de capital fixe témoigne d'un dynamisme d'investissement soutenu, favorable à la croissance future.",
            )
        if latest_value >= 20:
            return (
                "BALANCED",
                "Investissement dans la norme",
                "Le niveau d'investissement est conforme à la moyenne mondiale — suffisant pour maintenir le stock de capital productif.",
            )
        return (
            "WATCH",
            "Investissement insuffisant",
            "Un faible niveau d'investissement fixe peut éroder la capacité productive et peser sur la croissance potentielle à moyen terme.",
        )

    if lens_code == "FDI_ATTRACTIVENESS":
        if latest_value >= 4:
            return (
                "POSITIVE",
                "Forte attractivité aux IDE",
                "Des flux élevés d'investissements directs étrangers reflètent la confiance internationale et stimulent transferts de technologie et création d'emplois.",
            )
        if latest_value >= 1.5:
            return (
                "BALANCED",
                "Attractivité IDE modérée",
                "Les IDE entrants sont présents mais limités — l'environnement institutionnel offre des opportunités sans parvenir à une attractivité optimale.",
            )
        if latest_value >= 0:
            return (
                "WATCH",
                "Faible attractivité aux IDE",
                "Des flux d'IDE très limités peuvent signaler des barrières réglementaires, une instabilité perçue ou un manque de compétitivité structurelle.",
            )
        return (
            "STRESS",
            "Sorties nettes de capitaux",
            "Des IDE nets négatifs indiquent des sorties de capitaux étrangers — signal de perte de confiance ou de restructuration des investissements.",
        )

    if lens_code == "LABOR_PARTICIPATION":
        if latest_value >= 65:
            return (
                "POSITIVE",
                "Très fort taux d'activité",
                "Un taux d'activité élevé signale une économie avec une base productive large et une participation inclusive de la population en âge de travailler.",
            )
        if latest_value >= 55:
            return (
                "BALANCED",
                "Taux d'activité dans la norme",
                "La participation au marché du travail est conforme aux standards mondiaux, sans signal d'exclusion ou de sous-utilisation marquée.",
            )
        return (
            "WATCH",
            "Faible participation au travail",
            "Un taux d'activité bas peut refléter des inégalités de genre, une population âgée, ou des contraintes d'accès à l'emploi formel.",
        )

    if lens_code == "SOCIAL_INEQUALITY":
        if latest_value <= 28:
            return (
                "POSITIVE",
                "Inégalités faibles",
                "Un Gini bas reflète une répartition des revenus relativement équitable, favorable à la cohésion sociale et à la confiance dans les institutions.",
            )
        if latest_value <= 38:
            return (
                "BALANCED",
                "Inégalités modérées",
                "Les inégalités sont dans la fourchette médiane mondiale — présentes mais sans fracturer la cohésion sociale.",
            )
        if latest_value <= 50:
            return (
                "WATCH",
                "Inégalités élevées",
                "Un Gini élevé indique une concentration marquée des revenus, pouvant alimenter des tensions sociales et fragiliser la stabilité politique.",
            )
        return (
            "STRESS",
            "Inégalités très fortes",
            "Parmi les niveaux d'inégalités les plus élevés au monde — signal d'une fracture structurelle profonde entre les couches de la population.",
        )

    if lens_code == "EDUCATION_INVESTMENT":
        if latest_value >= 5.5:
            return (
                "POSITIVE",
                "Fort investissement éducatif",
                "Des dépenses publiques d'éducation élevées signalent une priorité accordée au capital humain, déterminant de la productivité et de la résilience à long terme.",
            )
        if latest_value >= 3.5:
            return (
                "BALANCED",
                "Investissement éducatif standard",
                "Les dépenses d'éducation sont dans la norme internationale — suffisantes pour maintenir la base de capital humain.",
            )
        return (
            "WATCH",
            "Investissement éducatif faible",
            "De faibles dépenses publiques d'éducation risquent de compromettre la qualité du capital humain et la compétitivité à long terme.",
        )

    if lens_code == "DIGITAL_CONNECTIVITY":
        if latest_value >= 85:
            return (
                "POSITIVE",
                "Économie très connectée",
                "Une pénétration d'Internet quasi-universelle reflète un niveau de modernisation avancé et une participation pleine à l'économie numérique mondiale.",
            )
        if latest_value >= 60:
            return (
                "BALANCED",
                "Connectivité en développement",
                "La pénétration d'Internet est en progression mais laisse encore une fraction significative de la population non connectée.",
            )
        return (
            "WATCH",
            "Fracture numérique visible",
            "Une pénétration d'Internet limitée signale une fracture numérique pouvant exclure une partie de la population des bénéfices de l'économie connectée.",
        )

    if lens_code in ("RULE_OF_LAW", "CORRUPTION_CONTROL", "GOVT_EFFECTIVENESS", "POLITICAL_STABILITY", "VOICE_ACCOUNTABILITY", "REGULATORY_QUALITY"):
        if latest_value >= 1.0:
            return ("POSITIVE", "Gouvernance de haute qualité", "Le score WGI dépasse +1,0 — signe d'institutions solides et de confiance forte dans le système juridique et réglementaire.")
        if latest_value >= 0.0:
            return ("BALANCED", "Gouvernance correcte", "Le score WGI est positif mais modéré — qualité institutionnelle acceptable avec des marges d'amélioration.")
        if latest_value >= -0.75:
            return ("WATCH", "Gouvernance fragile", "Le score WGI est en territoire négatif — institutions plus fragiles, risques institutionnels à intégrer dans l'analyse.")
        return ("STRESS", "Déficit de gouvernance", "Le score WGI est très négatif — signal de faiblesse institutionnelle structurelle affectant l'environnement des affaires et la sécurité.")

    if lens_code == "HUMAN_DEVELOPMENT":
        if latest_value >= 0.800:
            return ("POSITIVE", "Développement humain élevé", "L'IDH dépasse le seuil ONU de développement humain élevé (≥ 0,800) — indicateur de santé, éducation et revenu de bonne qualité.")
        if latest_value >= 0.600:
            return ("BALANCED", "Développement humain moyen", "L'IDH se situe dans la catégorie ONU de développement humain moyen — progrès réels mais des déficits subsistent.")
        if latest_value >= 0.400:
            return ("WATCH", "Développement humain faible", "L'IDH en dessous de 0,600 signale des lacunes significatives en santé, éducation ou revenu par habitant.")
        return ("STRESS", "Développement humain très faible", "L'IDH inférieur à 0,400 indique une vulnérabilité humaine profonde — priorité à l'investissement social.")

    if lens_code == "GENDER_INEQUALITY":
        if latest_value <= 0.10:
            return ("POSITIVE", "Très faibles inégalités de genre", "Le GII est parmi les plus bas au monde — égalité quasi atteinte dans les trois dimensions mesurées.")
        if latest_value <= 0.30:
            return ("BALANCED", "Inégalités de genre modérées", "Le GII est dans la fourchette des pays à développement élevé — des inégalités existent mais restent contenues.")
        if latest_value <= 0.55:
            return ("WATCH", "Inégalités de genre significatives", "Le GII révèle des écarts substantiels entre les genres — frein au développement humain et à la croissance inclusive.")
        return ("STRESS", "Inégalités de genre fortes", "Un GII élevé signale de fortes disparités structurelles — indicateur de risque social et de sous-utilisation du capital humain féminin.")

    if lens_code == "AGRI_SHARE":
        if latest_value >= 20:
            return ("WATCH", "Économie à dominante agricole", "Une part élevée de l'agriculture dans le PIB indique une économie peu diversifiée, sensible aux aléas climatiques et aux prix agricoles mondiaux.")
        if latest_value >= 8:
            return ("BALANCED", "Agriculture significative", "L'agriculture représente une part notable mais non dominante — économie en transition vers l'industrie et les services.")
        return ("POSITIVE", "Économie tertiarisée / industrialisée", "Une faible part agricole confirme une diversification avancée vers des secteurs à plus forte valeur ajoutée.")

    if lens_code == "INDUSTRY_SHARE":
        if latest_value >= 35:
            return ("POSITIVE", "Forte base industrielle", "Une part industrielle élevée reflète une économie avec une capacité de transformation et d'export significative.")
        if latest_value >= 20:
            return ("BALANCED", "Industrialisation en cours", "L'industrie représente une part significative mais non dominante — économie en phase de diversification.")
        return ("WATCH", "Faible industrialisation", "Une part industrielle limitée peut signaler une dépendance aux matières premières ou une économie encore peu transformatrice.")

    if lens_code == "SERVICES_SHARE":
        if latest_value >= 65:
            return ("POSITIVE", "Économie de services mature", "Une part des services très élevée reflète une économie de la connaissance avancée avec une forte valeur ajoutée immatérielle.")
        if latest_value >= 50:
            return ("BALANCED", "Tertiarisation en cours", "La part des services est majoritaire — l'économie s'oriente vers le tertiaire tout en conservant une base industrielle ou agricole.")
        return ("WATCH", "Faible part des services", "Une économie peu tertiarisée peut indiquer un stade de développement précoce ou une concentration sur les ressources primaires.")

    if lens_code == "LITERACY_RATE":
        if latest_value >= 97:
            return ("POSITIVE", "Alphabétisation quasi universelle", "Un taux d'alphabétisation très élevé reflète un capital humain de base solide et une participation pleine à l'économie formelle.")
        if latest_value >= 85:
            return ("BALANCED", "Alphabétisation correcte", "Le taux d'alphabétisation est satisfaisant mais une fraction de la population adulte reste encore sans maîtrise des compétences de base.")
        return ("STRESS", "Déficit d'alphabétisation", "Un taux d'alphabétisation faible est un frein structurel majeur au développement du capital humain et à la productivité.")

    if lens_code == "ELECTRICITY_ACCESS":
        if latest_value >= 98:
            return ("POSITIVE", "Accès universel à l'électricité", "L'électrification est quasi-complète — infrastructure essentielle disponible pour l'ensemble de la population.")
        if latest_value >= 75:
            return ("BALANCED", "Électrification en cours", "La majorité de la population a accès à l'électricité mais une fraction significative reste non connectée.")
        return ("STRESS", "Déficit d'électrification", "Un accès limité à l'électricité est un frein direct à l'industrialisation, l'éducation et les soins de santé.")

    if lens_code == "WATER_ACCESS":
        if latest_value >= 98:
            return ("POSITIVE", "Accès universel à l'eau potable", "L'accès à une eau améliorée est quasi-universel — base sanitaire solide réduisant les maladies hydriques.")
        if latest_value >= 80:
            return ("BALANCED", "Accès majoritaire à l'eau potable", "La majorité de la population dispose d'une eau potable sûre mais des gaps persistent en zones rurales ou précaires.")
        return ("STRESS", "Déficit d'accès à l'eau", "Un accès limité à l'eau potable constitue un risque sanitaire majeur, directement lié à la mortalité infantile et à la charge de morbidité.")

    if lens_code == "MILITARY_SPENDING":
        if latest_value >= 5:
            return ("WATCH", "Dépenses militaires très élevées", "Des dépenses militaires dépassant 5 % du PIB signalent des tensions sécuritaires importantes et un risque d'éviction des dépenses sociales et d'investissement.")
        if latest_value >= 2.5:
            return ("BALANCED", "Dépenses militaires dans la norme OTAN", "Les dépenses militaires sont dans la fourchette des pays membres ou proches de l'OTAN — sans signaler de surcharge budgétaire excessive.")
        return ("POSITIVE", "Dépenses militaires contenues", "Des dépenses militaires faibles préservent l'espace budgétaire pour les investissements sociaux, l'éducation et les infrastructures.")

    if lens_code == "SAFETY_HOMICIDE":
        if latest_value <= 1:
            return ("POSITIVE", "Taux d'homicides très faible", "Moins d'un homicide pour 100 000 habitants — environnement sécuritaire parmi les plus stables au monde, favorable à l'investissement et à la qualité de vie.")
        if latest_value <= 5:
            return ("BALANCED", "Taux d'homicides modéré", "Taux d'homicides dans la fourchette des pays à revenu intermédiaire ou élevé — sécurité publique acceptable sans signaler de crise.")
        if latest_value <= 20:
            return ("WATCH", "Taux d'homicides élevé", "Un taux d'homicides supérieur à 5 pour 100 000 indique des fragilités sécuritaires structurelles — frein potentiel à l'investissement et à la cohésion sociale.")
        return ("STRESS", "Taux d'homicides critique", "Un taux supérieur à 20 pour 100 000 caractérise une crise sécuritaire sévère — impact direct sur le capital humain, la mobilité et l'attractivité économique.")

    if lens_code == "CENTRAL_BANK_RATE":
        if latest_value <= 2:
            return ("POSITIVE", "Politique monétaire très accommodante", "Le taux directeur très bas favorise le crédit et l'investissement — mais peut alimenter une inflation latente si prolongé.")
        if latest_value <= 6:
            return ("BALANCED", "Taux directeur neutre", "Le taux directeur est dans une fourchette neutre — politique monétaire ni particulièrement restrictive ni stimulante.")
        if latest_value <= 15:
            return ("WATCH", "Politique monétaire restrictive", "Un taux directeur élevé alourdit le coût du crédit — signal de lutte anti-inflationniste ou de défense de la monnaie nationale.")
        return ("STRESS", "Taux directeur en crise", "Un taux directeur très élevé reflète une pression monétaire sévère — risque de credit crunch et de ralentissement économique.")

    if lens_code == "PRIVATE_CREDIT":
        if latest_value >= 100:
            return ("POSITIVE", "Système financier très développé", "Le crédit privé dépasse le PIB — signe d'un secteur financier profond, à surveiller pour le risque de surendettement.")
        if latest_value >= 50:
            return ("BALANCED", "Approfondissement financier correct", "Le niveau de crédit privé reflète un secteur financier opérationnel, capable de financer l'investissement et la consommation.")
        return ("WATCH", "Sous-développement financier", "Un crédit privé limité restreint l'accès au financement pour les entreprises et les ménages — frein à la croissance.")

    if lens_code == "FX_RESERVES":
        return ("CONTEXT", "Réserves de change", "Les réserves de change et d'or sont exprimées en USD — leur adéquation dépend des importations mensuelles couvertes et du niveau de dette extérieure à court terme.")

    if lens_code == "BROAD_MONEY":
        if latest_value >= 100:
            return ("POSITIVE", "Économie très monétarisée", "Une masse monétaire large supérieure au PIB indique un système financier profond et une intermédiation bancaire développée.")
        if latest_value >= 50:
            return ("BALANCED", "Monétarisation dans la norme", "La masse monétaire large est dans la fourchette des économies émergentes — système financier fonctionnel.")
        return ("WATCH", "Économie peu monétarisée", "Une faible masse monétaire relative signale une économie encore peu bancarisée, limitant l'accès au crédit et l'épargne formelle.")

    if lens_code in ("ADB_GROWTH", "AFDB_GROWTH"):
        if latest_value >= 4:
            return ("POSITIVE", "Expansion forte (source régionale)", "La source régionale de développement confirme une croissance soutenue du PIB.")
        if latest_value >= 2:
            return ("BALANCED", "Expansion saine", "La croissance est positive et résiliente selon la source régionale.")
        if latest_value >= 0:
            return ("WATCH", "Croissance faible", "La croissance peine à s'affirmer — signal de vigilance sur la dynamique économique.")
        return ("STRESS", "Contraction économique", "La source régionale indique une contraction du PIB — pression cyclique ou structurelle.")

    if lens_code in ("ADB_POVERTY", "CEPAL_POVERTY"):
        if latest_value <= 5:
            return ("POSITIVE", "Pauvreté très faible", "Moins de 5 % de la population vit sous le seuil de pauvreté — résultat de politiques sociales efficaces.")
        if latest_value <= 20:
            return ("BALANCED", "Pauvreté modérée", "Le taux de pauvreté est géré mais des efforts restent nécessaires pour une inclusion économique complète.")
        if latest_value <= 40:
            return ("WATCH", "Pauvreté élevée", "Une part significative de la population sous le seuil de pauvreté — contrainte sur la demande intérieure et la cohésion sociale.")
        return ("STRESS", "Pauvreté très élevée", "Plus de 40 % de la population en situation de pauvreté — fragilité structurelle profonde.")

    if lens_code == "CEPAL_EXTREME_POVERTY":
        if latest_value <= 3:
            return ("POSITIVE", "Indigence quasi éliminée", "Moins de 3 % de la population en situation d'extrême pauvreté — signe de résilience sociale effective.")
        if latest_value <= 10:
            return ("BALANCED", "Pauvreté extrême résiduelle", "Une pauvreté extrême présente mais contenue — des filets de sécurité sont en place mais perfectibles.")
        if latest_value <= 25:
            return ("WATCH", "Pauvreté extrême élevée", "Une fraction significative de la population sans accès aux besoins essentiels — priorité pour les politiques sociales.")
        return ("STRESS", "Indigence massive", "Plus d'un quart de la population en extrême pauvreté — situation d'urgence sociale et humanitaire.")

    if lens_code == "HIV_PREVALENCE":
        if latest_value <= 0.1:
            return ("POSITIVE", "Épidémie VIH très limitée", "La prévalence du VIH est inférieure à 0,1 % — impact sur la santé publique et l'économie très faible.")
        if latest_value <= 1:
            return ("BALANCED", "Prévalence VIH contenue", "La prévalence reste sous 1 % avec des programmes de prévention et de traitement actifs.")
        if latest_value <= 5:
            return ("WATCH", "Prévalence VIH notable", "Une prévalence supérieure à 1 % implique une charge sanitaire et économique mesurable — renforcement des programmes requis.")
        return ("STRESS", "Épidémie VIH sévère", "Une prévalence supérieure à 5 % signale une épidémie sévère avec impact profond sur la démographie, la productivité et les finances publiques.")

    if lens_code == "ART_COVERAGE":
        if latest_value >= 90:
            return ("POSITIVE", "Couverture ARV quasi universelle", "Plus de 90 % des personnes vivant avec le VIH sont sous traitement — objectif 90-90-90 ONUSIDA en bonne voie.")
        if latest_value >= 65:
            return ("BALANCED", "Couverture ARV en progrès", "La couverture ARV est significative mais des gaps d'accès aux soins persistent.")
        return ("STRESS", "Couverture ARV insuffisante", "Moins de 65 % de couverture ARV — des milliers de personnes séropositives restent sans traitement, amplifiant le risque de transmission.")

    if lens_code == "AFDB_FDI":
        if latest_value >= 4:
            return ("POSITIVE", "Forte attractivité aux IDE (AfDB)", "Des flux d'IDE élevés en % du PIB selon l'AfDB reflètent la confiance des investisseurs internationaux dans l'économie nationale.")
        if latest_value >= 1.5:
            return ("BALANCED", "Attractivité IDE modérée", "Les IDE entrants sont présents mais limités — environnement des affaires en cours d'amélioration.")
        if latest_value >= 0:
            return ("WATCH", "Faible attractivité aux IDE", "Des flux d'IDE très limités signalent des barrières réglementaires, une instabilité perçue ou un manque d'infrastructure.")
        return ("STRESS", "Sorties nettes de capitaux étrangers", "Des IDE nets négatifs indiquent un désengagement des investisseurs — signal de méfiance ou de restructuration des portefeuilles.")

    if lens_code == "PRIMARY_ENROLLMENT":
        if latest_value >= 97:
            return ("POSITIVE", "Scolarisation primaire quasi universelle", "Presque tous les enfants en âge primaire sont effectivement scolarisés — fondement solide du capital humain.")
        if latest_value >= 85:
            return ("BALANCED", "Scolarisation primaire correcte", "La majorité des enfants accèdent à l'école primaire, avec une fraction encore non scolarisée à cibler.")
        return ("STRESS", "Scolarisation primaire insuffisante", "Un faible taux de scolarisation primaire signale des barrières d'accès — pauvreté, genre, distance — freinant le développement humain.")

    if lens_code == "SECONDARY_ENROLLMENT":
        if latest_value >= 90:
            return ("POSITIVE", "Forte continuité scolaire au secondaire", "La quasi-totalité des adolescents en âge scolaire poursuivent une éducation secondaire — capital humain avancé.")
        if latest_value >= 65:
            return ("BALANCED", "Scolarisation secondaire modérée", "La majorité des jeunes accèdent au secondaire avec des marges d'amélioration pour les groupes défavorisés.")
        return ("WATCH", "Taux d'abandon scolaire élevé", "Un faible taux net de scolarisation secondaire indique un abandon précoce qui limitera la productivité future et la mobilité sociale.")

    if lens_code == "SANITATION_ACCESS":
        if latest_value >= 97:
            return ("POSITIVE", "Accès aux sanitaires quasi universel", "L'assainissement de base couvre presque toute la population — risques sanitaires hydriques très réduits.")
        if latest_value >= 80:
            return ("BALANCED", "Accès à l'assainissement majoritaire", "La majorité de la population dispose de sanitaires améliorés, mais des gaps persistent dans certaines zones.")
        return ("STRESS", "Déficit d'assainissement", "Un accès limité à l'assainissement entraîne des maladies évitables, une mortalité infantile plus élevée et une perte de productivité.")

    if lens_code == "RURAL_POPULATION":
        if latest_value >= 60:
            return ("CONTEXT", "Économie à dominante rurale", "Plus de 60 % de la population vit en zone rurale — enjeux structurels d'accès aux services et d'urbanisation.")
        if latest_value >= 30:
            return ("CONTEXT", "Population mixte urbain-rural", "La population est répartie entre zones rurales et urbaines — transition démographique et enjeux d'équité territoriale.")
        return ("CONTEXT", "Pays fortement urbanisé", "Moins de 30 % de la population est rurale — urbanisation avancée avec des enjeux de densification et de services urbains.")

    if lens_code == "ARABLE_LAND":
        if latest_value >= 30:
            return ("POSITIVE", "Fort potentiel agricole", "Une large part de terres arables confère un avantage comparatif dans l'agriculture et la sécurité alimentaire.")
        if latest_value >= 10:
            return ("BALANCED", "Potentiel agricole modéré", "Les terres arables sont présentes mais limitées — base agricole opérationnelle sans constituer un avantage compétitif majeur.")
        return ("CONTEXT", "Terres arables limitées", "Peu de terres arables — dépendance potentielle aux importations alimentaires selon les contraintes géographiques.")

    if lens_code == "ECB_HICP":
        if latest_value <= 2:
            return ("POSITIVE", "Inflation dans la cible BCE", "L'IPCH est dans ou sous la cible de 2 % de la BCE — stabilité des prix favorable aux ménages et aux entreprises.")
        if latest_value <= 4:
            return ("WATCH", "Inflation au-dessus de la cible BCE", "L'IPCH dépasse la cible — pression sur le pouvoir d'achat et probable resserrement monétaire de la BCE.")
        return ("STRESS", "Forte inflation HICP", "L'inflation harmonisée est nettement supérieure à la cible — contexte de resserrement monétaire actif ou de choc d'offre sévère.")

    if lens_code == "ECB_BOND_YIELD":
        if latest_value <= 2:
            return ("POSITIVE", "Taux souverain très favorable", "Un rendement à 10 ans très bas reflète une prime de risque quasi nulle — financement public à coût minimal.")
        if latest_value <= 4:
            return ("BALANCED", "Taux souverain dans la norme", "Le rendement obligataire est dans une fourchette historiquement normale — coût de financement gérable.")
        if latest_value <= 7:
            return ("WATCH", "Prime de risque souverain notable", "Un rendement élevé signale une méfiance relative des marchés — coût de financement public accru.")
        return ("STRESS", "Crise de confiance souveraine", "Un rendement très élevé indique une crise de confiance des marchés — risque de spirale dette / taux.")

    if lens_code == "UNCTAD_FDI":
        if latest_value >= 4:
            return ("POSITIVE", "Forte attractivité aux IDE (CNUCED)", "Les flux d'IDE confirment l'attractivité internationale du pays selon la référence CNUCED.")
        if latest_value >= 1.5:
            return ("BALANCED", "Attractivité IDE modérée (CNUCED)", "Les IDE sont présents mais contenus — environnement des affaires fonctionnel sans attirer massivement les capitaux étrangers.")
        if latest_value >= 0:
            return ("WATCH", "Faible attractivité IDE (CNUCED)", "Des flux d'IDE limités reflètent des barrières perçues ou un manque de compétitivité structurelle.")
        return ("STRESS", "Désinvestissement étranger (CNUCED)", "Des IDE nets négatifs signalent un retrait des investisseurs étrangers — méfiance ou restructuration.")

    if lens_code == "UNESCO_OOS":
        if latest_value <= 3:
            return ("POSITIVE", "Scolarisation primaire quasi universelle (UNESCO)", "Moins de 3 % d'enfants hors école primaire — objectif ODD 4 quasi atteint.")
        if latest_value <= 10:
            return ("BALANCED", "Exclusion scolaire modérée", "Entre 3 et 10 % d'enfants non scolarisés — efforts ciblés requis pour atteindre l'universalité.")
        return ("STRESS", "Exclusion scolaire élevée (UNESCO)", "Plus de 10 % des enfants en âge primaire ne vont pas à l'école — défi majeur pour le développement humain.")

    if lens_code == "UNESCO_LITERACY":
        if latest_value >= 99:
            return ("POSITIVE", "Alphabétisation quasi universelle (UNESCO)", "Quasi 100 % d'adultes alphabétisés — capital humain maximal selon l'UNESCO UIS.")
        if latest_value >= 90:
            return ("POSITIVE", "Alphabétisation élevée (UNESCO)", "Plus de 90 % d'adultes alphabétisés — base solide pour la participation économique formelle.")
        if latest_value >= 75:
            return ("BALANCED", "Alphabétisation correcte (UNESCO)", f"{latest_value:.0f} % d'adultes alphabétisés — des progrès restent à faire pour l'inclusion économique totale.")
        if latest_value >= 50:
            return ("WATCH", "Alphabétisation partielle (UNESCO)", f"{latest_value:.0f} % — une part significative d'adultes en situation d'illettrisme impacte la productivité et l'accès aux droits.")
        return ("STRESS", "Alphabétisation critique (UNESCO)", f"Moins de 50 % d'adultes alphabétisés — frein structurel majeur au développement économique et humain.")

    if lens_code == "IMPORTS_SHARE":
        if latest_value >= 60:
            return ("WATCH", "Forte dépendance aux importations", f"{latest_value:.1f} % du PIB en importations — exposition significative aux chocs de prix et de change extérieurs.")
        if latest_value >= 35:
            return ("BALANCED", "Importations dans la norme", f"{latest_value:.1f} % du PIB — intégration commerciale équilibrée sans dépendance excessive.")
        return ("BALANCED", "Faible exposition aux importations", f"{latest_value:.1f} % du PIB — économie relativement autosuffisante ou peu intégrée au commerce mondial.")

    if lens_code == "POPULATION_SIZE":
        if latest_value >= 1_000_000_000:
            return ("CONTEXT", f"Géant démographique ({latest_value / 1e9:.1f} Md hab.)", "Marché intérieur massif avec des défis structurels proportionnels à la taille de la population.")
        if latest_value >= 100_000_000:
            return ("CONTEXT", f"Grande économie ({latest_value / 1e6:.0f} M hab.)", "Poids démographique significatif — marché intérieur de taille mondiale.")
        if latest_value >= 10_000_000:
            return ("CONTEXT", f"Pays de taille moyenne ({latest_value / 1e6:.0f} M hab.)", "Population suffisante pour un marché intérieur viable avec une économie d'échelle partielle.")
        return ("CONTEXT", f"Petite économie ({latest_value / 1e6:.1f} M hab.)", "Marché intérieur limité — ouverture commerciale et attractivité aux investissements étrangers cruciales.")

    if lens_code == "FISCAL_EXPENDITURE":
        if latest_value >= 55:
            return ("WATCH", "Dépenses publiques très élevées", f"{latest_value:.1f} % du PIB — rôle dominant de l'État avec des risques budgétaires à surveiller.")
        if latest_value >= 40:
            return ("BALANCED", "Dépenses publiques modérées à élevées", f"{latest_value:.1f} % du PIB — État présent dans l'économie, en ligne avec les démocraties développées.")
        if latest_value >= 25:
            return ("BALANCED", "Dépenses publiques modérées", f"{latest_value:.1f} % du PIB — équilibre entre intervention publique et espace pour le secteur privé.")
        return ("WATCH", "Dépenses publiques faibles", f"{latest_value:.1f} % du PIB — capacité limitée de l'État à financer les services publics et infrastructures.")

    if lens_code == "PHYSICIANS_DENSITY":
        if latest_value >= 4:
            return ("POSITIVE", "Couverture médicale excellente", f"{latest_value:.2f} médecins / 1 000 hab. — accès aux soins parmi les meilleurs au monde.")
        if latest_value >= 2:
            return ("POSITIVE", "Bonne densité médicale", f"{latest_value:.2f} médecins / 1 000 hab. — capacité de soins satisfaisante selon les standards OMS.")
        if latest_value >= 1:
            return ("BALANCED", "Densité médicale acceptable", f"{latest_value:.2f} médecins / 1 000 hab. — au-dessus du seuil OMS mais avec des disparités territoriales potentielles.")
        if latest_value >= 0.5:
            return ("WATCH", "Pénurie médicale modérée", f"{latest_value:.2f} médecins / 1 000 hab. — en dessous du seuil OMS de 1 — risque de goulets d'étranglement dans l'accès aux soins.")
        return ("STRESS", "Pénurie médicale sévère", f"{latest_value:.2f} médecins / 1 000 hab. — sous le seuil critique d'urgence sanitaire selon l'OMS.")

    if lens_code == "CO2_EMISSIONS":
        if latest_value >= 15:
            return ("STRESS", "Empreinte carbone très élevée", f"{latest_value:.1f} t CO₂e / hab. — parmi les émetteurs les plus intensifs — pression climatique et risque de transition énergétique coûteuse.")
        if latest_value >= 8:
            return ("WATCH", "Empreinte carbone élevée", f"{latest_value:.1f} t CO₂e / hab. — au-dessus des moyennes mondiales — efforts de décarbonation nécessaires.")
        if latest_value >= 4:
            return ("BALANCED", "Empreinte carbone modérée", f"{latest_value:.1f} t CO₂e / hab. — dans la moyenne mondiale — trajectory de décarbonation à maintenir.")
        return ("POSITIVE", "Empreinte carbone faible", f"{latest_value:.1f} t CO₂e / hab. — faible intensité carbone — souvent corrélée à un mix énergétique plus propre ou à une économie moins industrialisée.")

    trend_note = {
        "UP": "La série sélectionnée est encore en hausse.",
        "DOWN": "La série sélectionnée est maintenant orientée à la baisse.",
        "FLAT": "La série sélectionnée est globalement stable.",
        "INSUFFICIENT_DATA": "La série source sélectionnée est trop courte pour dériver une tendance fiable.",
    }.get(trend_direction, "La tendance de la source sélectionnée n'est pas disponible.")

    return (
        "CONTEXT",
        "Signal contextuel",
        trend_note,
    )


REGIONAL_ECONOMIC_LENS_PROFILES = ECONOMIC_LENS_PROFILES


RELATIVE_COST_LENS_PROFILES: tuple[RelativeCostLensProfile, ...] = (
    RelativeCostLensProfile(
        lens_code="GENERAL_COST_LEVEL",
        lens_display_name="Niveau de coût général",
        indicator_code="WHV.PRICE.LEVEL.GDP.OECD100",
        why_it_matters="Indique si le pays ou la région se situe au-dessus ou en dessous du benchmark OCDE pour les niveaux de prix globaux.",
    ),
    RelativeCostLensProfile(
        lens_code="HOUSING_MARKET_HEAT",
        lens_display_name="Surchauffe immobilière",
        indicator_code="WHV.HOUSING.PRICE.REAL.INDEX2015",
        why_it_matters="Suit si les prix immobiliers réels sont au-dessus ou en dessous de leur référence 2015 et si la pression continue de croître.",
    ),
    RelativeCostLensProfile(
        lens_code="CONSUMER_PRICE_PRESSURE",
        lens_display_name="Pression sur les prix à la consommation",
        indicator_code="FP.CPI.TOTL.ZG",
        why_it_matters="Indique si l'inflation actuelle ajoute une pression à court terme sur la situation de coût relatif globale.",
    ),
)


RELATIVE_COST_DECISION_PROFILES: tuple[RelativeCostDecisionProfile, ...] = (
    RelativeCostDecisionProfile(
        decision_code="TRAVEL_AFFORDABILITY",
        decision_display_name="Accessibilité au voyage",
        why_it_matters=(
            "Traduit les données de niveau de prix, d'inflation et de pression immobilière en un signal pratique de planification "
            "des coûts de voyage, sans prétendre remplacer les tarifs FX, hôtels ou courts séjours en temps réel."
        ),
        supporting_lens_codes=("GENERAL_COST_LEVEL", "CONSUMER_PRICE_PRESSURE", "HOUSING_MARKET_HEAT"),
    ),
    RelativeCostDecisionProfile(
        decision_code="HOUSEHOLD_AFFORDABILITY",
        decision_display_name="Pouvoir d'achat des ménages",
        why_it_matters=(
            "Combine la base de coût globale, la pression inflationniste actuelle et la tension immobilière en un signal "
            "d'accessibilité plus orienté décision, pour les résidents et les observateurs des politiques."
        ),
        supporting_lens_codes=("GENERAL_COST_LEVEL", "CONSUMER_PRICE_PRESSURE", "HOUSING_MARKET_HEAT"),
    ),
)


def describe_regional_relative_cost_lens(lens_code: str, median_value: float | None) -> tuple[EconomicLensTone, str, str]:
    if median_value is None:
        return (
            "CONTEXT",
            "Données comparables insuffisantes",
            "Les données multi-sources actuelles ne sont pas encore suffisamment riches pour décrire cette grille de coût relatif avec confiance.",
        )

    if lens_code == "GENERAL_COST_LEVEL":
        if median_value <= 80:
            return (
                "POSITIVE",
                "Nettement sous le benchmark OCDE",
                "Le niveau de prix médian régional est bien en dessous du niveau de référence OCDE, indiquant une base de coûts comparativement légère.",
            )
        if median_value <= 100:
            return (
                "BALANCED",
                "En dessous ou proche du benchmark OCDE",
                "Le niveau de prix médian régional reste en dessous ou proche du benchmark OCDE, plutôt que nettement au-dessus.",
            )
        if median_value <= 120:
            return (
                "WATCH",
                "Au-dessus du benchmark OCDE",
                "Le niveau de prix médian régional est au-dessus du benchmark OCDE, ce qui alourdit la base de coûts relative pour les ménages, les entreprises et les voyageurs.",
            )
        return (
            "STRESS",
            "Très au-dessus du benchmark OCDE",
            "Le niveau de prix médian régional est bien au-dessus du benchmark OCDE et indique un environnement de coûts significativement élevé.",
        )

    if lens_code == "HOUSING_MARKET_HEAT":
        if median_value <= 90:
            return (
                "BALANCED",
                "Immobilier sous la référence 2015",
                "La médiane des prix immobiliers réels régionaux reste sous sa base 2015, ce qui limite le signal de surchauffe immobilière accumulée.",
            )
        if median_value <= 110:
            return (
                "BALANCED",
                "Immobilier proche de la référence long terme",
                "La médiane des prix immobiliers réels régionaux reste proche de son benchmark 2015 plutôt qu'excessivement tendue.",
            )
        if median_value <= 130:
            return (
                "WATCH",
                "Immobilier au-dessus de la référence long terme",
                "La médiane des prix immobiliers réels régionaux est au-dessus de son benchmark 2015, indiquant une surchauffe visible du marché immobilier.",
            )
        return (
            "STRESS",
            "Immobilier très au-dessus de la référence long terme",
            "La médiane des prix immobiliers réels régionaux est bien au-dessus de son benchmark 2015 et signale une forte pression sur le marché immobilier.",
        )

    if lens_code == "CONSUMER_PRICE_PRESSURE":
        if median_value <= 3:
            return (
                "POSITIVE",
                "Pression actuelle des prix contenue",
                "L'inflation actuelle semble suffisamment maîtrisée pour ne pas aggraver significativement la situation de coût relatif global.",
            )
        if median_value <= 6:
            return (
                "WATCH",
                "Pression actuelle des prix visible",
                "L'inflation actuelle est suffisamment élevée pour pousser les coûts quotidiens à la hausse, même si la base de coûts globale reste gérable.",
            )
        return (
            "STRESS",
            "Pression actuelle des prix élevée",
            "L'inflation actuelle est suffisamment élevée pour aggraver significativement l'environnement de coûts à l'échelle régionale.",
        )

    return (
        "CONTEXT",
        "Signal contextuel",
        "Cette grille de coût relatif est actuellement exposée comme preuve contextuelle sans règle narrative spécifique.",
    )


def describe_country_relative_cost_lens(
    lens_code: str,
    latest_value: float | None,
    trend_direction: str,
) -> tuple[EconomicLensTone, str, str]:
    if latest_value is None:
        return (
            "CONTEXT",
            "Données comparables insuffisantes",
            "Les données multi-sources actuelles ne sont pas encore suffisamment riches pour décrire cette grille de coût relatif pays avec confiance.",
        )

    if lens_code == "GENERAL_COST_LEVEL":
        if latest_value <= 80:
            return (
                "POSITIVE",
                "Nettement sous le benchmark OCDE",
                "Le niveau de prix global du pays est bien en dessous du benchmark OCDE, indiquant une base de coûts comparativement légère.",
            )
        if latest_value <= 100:
            return (
                "BALANCED",
                "En dessous ou proche du benchmark OCDE",
                "Le niveau de prix global du pays est en dessous ou proche du benchmark OCDE, plutôt que nettement au-dessus.",
            )
        if latest_value <= 120:
            return (
                "WATCH",
                "Au-dessus du benchmark OCDE",
                "Le niveau de prix global du pays est au-dessus du benchmark OCDE, ce qui alourdit la base de coûts relative pour les ménages, les entreprises et les voyageurs.",
            )
        return (
            "STRESS",
            "Très au-dessus du benchmark OCDE",
            "Le niveau de prix global du pays est bien au-dessus du benchmark OCDE et indique un environnement de coûts significativement élevé.",
        )

    if lens_code == "HOUSING_MARKET_HEAT":
        if latest_value <= 90:
            headline = "Immobilier sous la référence 2015"
            narrative = "Les prix immobiliers réels restent sous la base 2015, ce qui limite le signal de surchauffe accumulée du marché immobilier."
            tone: EconomicLensTone = "BALANCED"
        elif latest_value <= 110:
            headline = "Immobilier proche de la référence long terme"
            narrative = "Les prix immobiliers réels restent proches du benchmark 2015 plutôt qu'excessivement tendus."
            tone = "BALANCED"
        elif latest_value <= 130:
            headline = "Immobilier au-dessus de la référence long terme"
            narrative = "Les prix immobiliers réels sont au-dessus du benchmark 2015, indiquant une surchauffe visible du marché immobilier."
            tone = "WATCH"
        else:
            headline = "Immobilier très au-dessus de la référence long terme"
            narrative = "Les prix immobiliers réels sont bien au-dessus du benchmark 2015 et signalent une forte pression sur le marché immobilier."
            tone = "STRESS"

        if trend_direction == "UP":
            narrative += " La série sélectionnée continue de monter, ce qui signifie que la pression ne se refroidit pas encore."
        elif trend_direction == "DOWN":
            narrative += " La série sélectionnée se détend, ce qui suggère un léger refroidissement de la pression immobilière."

        return tone, headline, narrative

    if lens_code == "CONSUMER_PRICE_PRESSURE":
        if latest_value <= 3:
            return (
                "POSITIVE",
                "Pression actuelle des prix contenue",
                "L'inflation actuelle semble suffisamment maîtrisée pour ne pas aggraver significativement la situation de coût relatif global.",
            )
        if latest_value <= 6:
            return (
                "WATCH",
                "Pression actuelle des prix visible",
                "L'inflation actuelle est suffisamment élevée pour pousser les coûts quotidiens à la hausse, même si la base de coûts globale reste gérable.",
            )
        return (
            "STRESS",
            "Pression actuelle des prix élevée",
            "L'inflation actuelle est suffisamment élevée pour aggraver significativement l'environnement de coûts des ménages et des voyageurs.",
        )

    trend_note = {
        "UP": "La série sélectionnée est encore en hausse.",
        "DOWN": "La série sélectionnée est maintenant orientée à la baisse.",
        "FLAT": "La série sélectionnée est globalement stable.",
        "INSUFFICIENT_DATA": "La série source sélectionnée est trop courte pour dériver une tendance fiable.",
    }.get(trend_direction, "La tendance de la source sélectionnée n'est pas disponible.")

    return (
        "CONTEXT",
        "Signal contextuel",
        trend_note,
    )