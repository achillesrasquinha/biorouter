# life-science-mcp

A unified MCP server for 299 life science APIs and databases (281 free, 18 API key). Two tools — `findTools` and `callTools` — provide progressive discovery across 857 endpoints with field projection and batch execution.

On top of individual API tools, **19 BioRouter endpoints** orchestrate multi-source queries across 197 providers in parallel — a single call like `compound/profile "ibuprofen"` fans out to 40+ APIs and returns a merged, deduplicated result.

## Installation

```json
{
  "mcpServers": {
    "life-science": {
      "command": "npx",
      "args": ["-y", "life-science-mcp"]
    }
  }
}
```

## BioRouter Endpoints (19)

High-level orchestrated queries that resolve identifiers, fan out to multiple APIs in parallel, and merge results with ranked provenance.

| Endpoint | Description |
|----------|-------------|
| `compound/profile` | Profile a drug or compound — structure, pharmacology, safety, targets, and clinical data |
| `compound/interactions` | Map drug interactions — mechanisms, targets, gene interactions, indications, and bioactivity |
| `compound/similar` | Find structurally similar compounds — fingerprint, substructure, and binding-based similarity |
| `disease/profile` | Profile a disease — phenotypes, genetics, ontology, therapeutics, and clinical classification |
| `disease/drugs` | Find drugs for a disease — approved treatments, clinical candidates, and drug-gene interactions |
| `protein/profile` | Profile a protein — sequence, function, expression, disease associations, and druggability |
| `protein/interactions` | Map protein interactions — PPIs, signaling, complexes, drug targets, and binding affinities |
| `protein/structure` | Analyze protein structure — 3D coordinates, domains, disorder, AlphaFold predictions, and classification |
| `pathway/profile` | Profile a biological pathway — reactions, participants, regulation, and cross-database annotations |
| `pathway/enrichment` | Analyze gene-set enrichment — GO terms, pathways, and functional categories for a gene list |
| `variant/annotate` | Annotate a genetic variant — pathogenicity, population frequency, consequence predictions, and pharmacogenomics |
| `cancer/profile` | Profile the molecular landscape of a cancer — mutations, copy number, clinical evidence, and therapeutic targets |
| `interaction/check` | Check molecular interactions — PPI evidence, signaling, complexes, and drug-gene links for two entities |
| `literature/search` | Search biomedical literature — publications, preprints, citations, and semantic annotations |
| `trial/search` | Search clinical trials — interventional studies, drug development, and precision medicine evidence |
| `organism/profile` | Profile an organism — taxonomy, genome, model organism resources, ecology, and phylogenetics |
| `sequence/search` | Search and retrieve sequences — nucleotide, protein, genomic context, alignments, and domain annotations |
| `data/search` | Search life-science data repositories — genomics, single-cell, proteomics, metabolomics, and imaging archives |
| `ontology/resolve` | Resolve biomedical terms — map free text, CURIEs, and accessions to ontology concepts across 900+ vocabularies |

## Providers (299)

| Provider | Description | Auth |
|----------|-------------|------|
| [1000 Genomes (IGSR)](https://www.internationalgenome.org/api) | International Genome Sample Resource — population genomics data from the 1000 Genomes Project | Free |
| [Addgene](https://www.addgene.org/api) | Addgene — nonprofit plasmid repository for sharing molecular biology reagents | Free |
| [AIRR Data Commons](https://vdjserver.org/airr/v1) | AIRR Data Commons — adaptive immune receptor repertoire sequencing data | Free |
| [Alliance of Genome Resources](https://www.alliancegenome.org/api) | Unified portal for model organism genes, diseases, and orthologs | Free |
| [Allen Brain Atlas](https://api.brain-map.org/api/v2) | Allen Institute brain gene expression and connectivity data | Free |
| [AmoebaDB](https://amoebadb.org/amoeba/service) | VEuPathDB resource for Entamoeba and free-living amoeba genomics | Free |
| [AlphaFold DB](https://alphafold.ebi.ac.uk/api) | AI-predicted protein structures from DeepMind | Free |
| [AquaMaps](https://aquamaps.org/webservice) | AquaMaps — predicted species distribution maps for marine and freshwater organisms | Free |
| [ArrayExpress](https://www.ebi.ac.uk/biostudies/api/v1) | ArrayExpress — gene expression and functional genomics experiments archive (EBI BioStudies) | Free |
| [ATC Classification](https://rxnav.nlm.nih.gov/REST/rxclass) | ATC (Anatomical Therapeutic Chemical) drug classification via RxNav/RxClass API | Free |
| [BERN2](https://bern2.korea.ac.kr) | BERN2 biomedical named entity recognition — extract genes, diseases, drugs, and other entities from text | Free |
| [Bgee](https://www.bgee.org/api) | Gene expression evolution database — expression across species and tissues | Free |
| [BiGG Models](https://bigg.ucsd.edu/api/v2) | BiGG Models — genome-scale metabolic network reconstructions | Free |
| [BindingDB](https://bindingdb.org/axis2/services/BDBService) | Public database of measured binding affinities between proteins and drug-like molecules | Free |
| [BioCyc](https://websvc.biocyc.org) | BioCyc / MetaCyc — metabolic pathway and genome database collection | Free |
| [Bioregistry](https://bioregistry.io/api) | Bioregistry — registry of 1000+ biological databases with identifier patterns and metadata | Free |
| [BioStudies](https://www.ebi.ac.uk/biostudies/api/v1) | BioStudies — EBI archive for biological study data linking publications to datasets | Free |
| [bio.tools](https://bio.tools/api) | ELIXIR bio.tools registry — bioinformatics tools and databases catalog | Free |
| [BioGRID](https://webservice.thebiogrid.org) | BioGRID database of protein and genetic interactions | API Key |
| [BioModels](https://biomodels.org) | BioModels repository — mathematical models of biological systems in SBML and other formats | Free |
| [BioPortal](https://data.bioontology.org) | NCBO BioPortal — search 900+ biomedical ontologies and annotate text with ontology concepts | API Key |
| [bioRxiv](https://api.biorxiv.org) | bioRxiv preprint server — access preprints in biology and related sciences | Free |
| [BMRB](https://api.bmrb.io/v2) | Biological Magnetic Resonance Bank — NMR spectroscopy data for proteins, nucleic acids, and metabolites | Free |
| [BioSamples](https://www.ebi.ac.uk/biosamples) | EBI BioSamples database — biological sample metadata and attributes | Free |
| [BOLD](https://www.boldsystems.org/index.php/API_Public) | Barcode of Life Data Systems — DNA barcode specimens and sequences for species identification | Free |
| [BrainSpan](https://api.brain-map.org/api/v2/data) | BrainSpan developmental transcriptome — human brain gene expression across developmental stages | Free |
| [BV-BRC](https://www.bv-brc.org/api) | Bacterial and Viral Bioinformatics Resource Center — pathogen genomics, AMR, and surveillance data | Free |
| [CADD](https://cadd.gs.washington.edu/api/v1.0) | Combined Annotation Dependent Depletion — variant deleteriousness scoring | Free |
| [CATH](https://www.cathdb.info/version/v4_3_0/api/rest) | Protein structure classification — hierarchical domain classification of protein structures | Free |
| [Catalogue of Life](https://api.catalogueoflife.org) | Catalogue of Life — global checklist of all known species with authoritative taxonomy | Free |
| [cBioPortal](https://www.cbioportal.org/api) | Cancer genomics portal — explore multidimensional cancer genomics data | Free |
| [CDC Open Data](https://data.cdc.gov/resource) | CDC Open Data — public health datasets via the Socrata Open Data API | Free |
| [CDC WONDER](https://wonder.cdc.gov/controller/datarequest) | CDC WONDER — Wide-ranging Online Data for Epidemiologic Research, public health datasets | Free |
| [CDD](https://www.ncbi.nlm.nih.gov/Structure/bwrpsb/bwrpsb.cgi) | NCBI Conserved Domain Database — identify conserved domains in protein sequences | Free |
| [Cellosaurus](https://api.cellosaurus.org) | Knowledge resource on cell lines — cell line identification and characterization | Free |
| [CELLxGENE](https://api.cellxgene.cziscience.com) | CZ CELLxGENE Discover — single-cell datasets and gene expression | Free |
| [ChEBI (via OLS4)](https://www.ebi.ac.uk/ols4/api) | Chemical Entities of Biological Interest — ontology lookup via EBI OLS4 | Free |
| [ChEMBL](https://www.ebi.ac.uk/chembl/api/data) | Database of bioactive drug-like small molecules | Free |
| [ChemSpider](https://api.rsc.org/compounds/v1) | RSC chemical compound search, structures, and properties database | API Key |
| [CIViC](https://civicdb.org/api/graphql) | Clinical Interpretations of Variants in Cancer — curated clinical evidence for variants | Free |
| [ClassyFire](http://classyfire.wishartlab.com) | Automated chemical classification using the ChemOnt ontology | Free |
| [ClinGen](https://search.clinicalgenome.org/kb/rest) | Clinical Genome Resource — gene-disease validity and dosage sensitivity curation | Free |
| [ClinGen Allele Registry](https://reg.clinicalgenome.org) | ClinGen Allele Registry — canonical allele identifiers linking variants across nomenclatures | Free |
| [NLM Clinical Tables](https://clinicaltables.nlm.nih.gov/api) | NLM Clinical Tables — autocomplete and lookup for ICD-10, LOINC, RxTerms, and conditions | Free |
| [ClinicalTrials.gov](https://clinicaltrials.gov/api/v2) | Registry of clinical studies conducted around the world | Free |
| [ClinVar](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Variant-disease relationship database linking genetic variants to clinical significance | Free |
| [Clustal Omega](https://www.ebi.ac.uk/Tools/services/rest/clustalo) | EBI Clustal Omega multiple sequence alignment service | Free |
| [COG](https://www.ncbi.nlm.nih.gov/research/cog/api) | Clusters of Orthologous Genes — ortholog classification and functional annotation across prokaryotes | Free |
| [COCONUT](https://coconut.naturalproducts.net/api) | COlleCtion of Open Natural prodUcTs — comprehensive natural products database | Free |
| [Complex Portal](https://www.ebi.ac.uk/intact/complex-ws) | Macromolecular complex database — curated stable protein complexes from EBI | Free |
| [Comparative Toxicogenomics Database](https://ctdbase.org/tools/batchQuery.go) | CTD curated chemical-gene-disease interactions for toxicogenomics research | Free |
| [CompTox](https://comptox.epa.gov/dashboard-api) | EPA CompTox Chemicals Dashboard for toxicology and chemical safety | Free |
| [Crossref](https://api.crossref.org) | Crossref — scholarly metadata for publications, journals, funders, and DOIs | Free |
| [CryptoDB](https://cryptodb.org/cryptodb/service) | VEuPathDB resource for Cryptosporidium genomics | Free |
| [DailyMed](https://dailymed.nlm.nih.gov/dailymed/services) | DailyMed drug label information from the National Library of Medicine — SPL documents and prescribing information | Free |
| [DataCite](https://api.datacite.org) | DataCite — DOI registration and metadata for research datasets and publications | Free |
| [DALI](http://ekhidna2.biocenter.helsinki.fi/dali) | DALI server — protein structure comparison by 3D alignment | Free |
| [DANDI Archive](https://api.dandiarchive.org/api) | DANDI — neurophysiology data integration, brain imaging and electrophysiology datasets | Free |
| [dbGaP](https://www.ncbi.nlm.nih.gov/gap/phegeni) | dbGaP (database of Genotypes and Phenotypes) — genotype-phenotype association studies | Free |
| [dbSNP](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Database of single nucleotide polymorphisms and other genetic variation | Free |
| [dbVar](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | NCBI dbVar — database of genomic structural variants (CNVs, insertions, deletions, inversions) | Free |
| [DDBJ](https://getentry.ddbj.nig.ac.jp/getentry) | DNA Data Bank of Japan — nucleotide sequence archive | Free |
| [dbfetch](https://www.ebi.ac.uk/Tools/dbfetch) | EBI dbfetch — sequence and entry retrieval from EMBL, UniProt, PDB, and 50+ databases | Free |
| [DeepLoc 2.0](https://api.biolib.com/app/DTU/DeepLoc-2.0) | DeepLoc 2.0 — protein subcellular localization prediction (DTU BioLib) | Free |
| [DepMap](https://depmap.org/portal/api) | Cancer Dependency Map — cell line genomic and dependency data | Free |
| [DGIdb](https://dgidb.org/api/graphql) | Drug-Gene Interaction Database — mining drug-gene interaction data | Free |
| [DisGeNET](https://www.disgenet.org/api) | Gene-disease association database | API Key |
| [DisProt](https://disprot.org/api) | Database of intrinsically disordered proteins and regions | Free |
| [DOAJ](https://doaj.org/api) | Directory of Open Access Journals — indexing quality open access research | Free |
| [DrugCentral](https://unmtid-shinyapps.net/download/DrugCentral) | Drug information resource integrating drug indications, mechanisms, and interactions | Free |
| [eBird](https://api.ebird.org/v2) | Cornell Lab eBird — bird observations, hotspots, and taxonomy worldwide | API Key |
| [EBI Search](https://www.ebi.ac.uk/ebisearch/ws/rest) | EBI Search — unified search across 400+ EBI databases (UniProt, PDB, SRA, etc.) | Free |
| [EggNOG](http://eggnog5.embl.de) | Orthologous groups and functional annotation from EggNOG | Free |
| [EMDB](https://www.ebi.ac.uk/emdb/api) | Electron Microscopy Data Bank — 3D cryo-EM density maps and tomograms | Free |
| [EMPIAR](https://www.ebi.ac.uk/empiar/api) | Electron Microscopy Public Image Archive for raw EM data | Free |
| [ENCODE SCREEN](https://api.wenglab.org/screen) | ENCODE SCREEN registry of candidate cis-regulatory elements (cCREs) | Free |
| [ENCODE](https://www.encodeproject.org) | Encyclopedia of DNA Elements — functional annotations of the human genome | Free |
| [Enrichr](https://maayanlab.cloud/Enrichr) | Enrichr — gene set enrichment analysis against curated gene-set libraries | Free |
| [Ensembl BioMart](https://www.ensembl.org/biomart/martservice) | Ensembl BioMart bulk annotation and data retrieval service | Free |
| [Ensembl VEP](https://rest.ensembl.org) | Variant Effect Predictor — predict functional effects of genetic variants | Free |
| [ENA Portal](https://www.ebi.ac.uk/ena/portal/api) | ENA Portal API — advanced search across ENA studies, samples, experiments, and assemblies | Free |
| [ENA Taxonomy](https://www.ebi.ac.uk/ena/taxonomy/rest) | EBI ENA Taxonomy — taxonomic classification lookup with lineage and common names | Free |
| [Ensembl](https://rest.ensembl.org) | Genome browser and annotation database | Free |
| [ELM](http://elm.eu.org) | Eukaryotic Linear Motifs — short functional motifs in proteins (cleavage sites, binding motifs, etc.) | Free |
| [EpiGraphDB](https://api.epigraphdb.org) | EpiGraphDB — epidemiological graph database for Mendelian randomization and causal inference | Free |
| [EU Clinical Trials Register](https://euclinicaltrials.eu/ctis-public/api) | European Union Clinical Trials Register for searching EU clinical studies | Free |
| [European Variation Archive](https://www.ebi.ac.uk/eva/webservices/rest/v1) | European Variation Archive — open-access database of genetic variants across species | Free |
| [Europe PMC](https://www.ebi.ac.uk/europepmc/webservices/rest) | Europe PubMed Central — open-access biomedical literature | Free |
| [Europe PMC Annotations](https://www.ebi.ac.uk/europepmc/annotations_api) | Text-mined named entities (genes, diseases, GO terms) from publications | Free |
| [European Genome-phenome Archive](https://ega-archive.org/metadata/v2) | EGA metadata API for controlled-access genomic and phenomic datasets | Free |
| [European Nucleotide Archive](https://www.ebi.ac.uk/ena) | Open-access nucleotide sequence data and associated information | Free |
| [Expression Atlas](https://www.ebi.ac.uk/gxa/json) | Gene expression patterns across species and biological conditions (EBI) | Free |
| [FAOSTAT](https://fenixservices.fao.org/faostat/api/v1/en) | FAO Statistics — food and agriculture data from the UN FAO | Free |
| [FDA Orange Book](https://api.fda.gov/drug) | FDA Orange Book drug patent and exclusivity data via openFDA | Free |
| [FHIR R4](https://hapi.fhir.org/baseR4) | FHIR R4 public test server — HL7 FHIR standard for healthcare data interoperability | Free |
| [FishBase](https://fishbase.ropensci.org) | FishBase — comprehensive database of fish species biology, ecology, and taxonomy | Free |
| [FlyBase](https://api.flybase.org/api/v1.0) | FlyBase — Drosophila melanogaster genomics, genetics, and molecular biology | Free |
| [FlyMine](https://www.flymine.org/flymine/service) | InterMine data warehouse for Drosophila genomics, orthologs, and interactions | Free |
| [FungiDB](https://fungidb.org/fungidb/service) | VEuPathDB resource for fungal genomics (Aspergillus, Candida, Cryptococcus) | Free |
| [g:Profiler](https://biit.cs.ut.ee/gprofiler) | g:Profiler — functional enrichment and gene ID conversion | Free |
| [GARD](https://rarediseases.info.nih.gov/gard-api) | GARD — Genetic and Rare Diseases Information Center from NIH | Free |
| [GBIF](https://api.gbif.org/v1) | Global Biodiversity Information Facility — species occurrence and taxonomy data worldwide | Free |
| [GDC](https://api.gdc.cancer.gov) | NCI Genomic Data Commons — cancer genomics data from TCGA and other programs | Free |
| [Geneshot](https://maayanlab.cloud/geneshot/api) | Geneshot — gene set discovery from PubMed literature mining (Ma'ayan Lab) | Free |
| [Gene Expression Omnibus](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Repository of high-throughput gene expression and genomics datasets | Free |
| [Gene Ontology](https://api.geneontology.org/api) | Gene Ontology API — GO terms, annotations, and bioentity information | Free |
| [GeneMANIA](https://genemania.org/api) | GeneMANIA — gene interaction network prediction and visualization | Free |
| [GlyCosmos](https://glycosmos.org/api) | GlyCosmos — integrated glycoscience portal for glycan structures, pathways, and diseases | Free |
| [GlyGen](https://api.glygen.org) | GlyGen — glycoscience data integration and retrieval | Free |
| [GlyTouCan](https://api.glycosmos.org) | GlyTouCan — international glycan structure repository | Free |
| [gnomAD](https://gnomad.broadinstitute.org/api) | Genome Aggregation Database — population variant frequencies and annotations | Free |
| [GNPS](https://gnps.ucsd.edu/ProteoSAFe) | GNPS — molecular networking and spectral library for mass spectrometry data | Free |
| [GPCRdb](https://gpcrdb.org/services) | GPCR database — G protein-coupled receptor structures, sequences, and pharmacology | Free |
| [Gramene](https://data.gramene.org) | Gramene — comparative plant genomics resource for crops and model species | Free |
| [GTEx Portal](https://gtexportal.org/api/v2) | Genotype-Tissue Expression project — gene expression across human tissues | Free |
| [GTDB](https://gtdb-api.ecogenomic.org) | Genome Taxonomy Database — standardized bacterial and archaeal taxonomy based on genome phylogeny | Free |
| [Guide to Pharmacology](https://www.guidetopharmacology.org/services) | IUPHAR/BPS Guide to Pharmacology database of drug targets and ligands | Free |
| [GWAS Catalog](https://www.ebi.ac.uk/gwas/rest/api) | NHGRI-EBI Catalog of genome-wide association studies | Free |
| [Harmonizome](https://maayanlab.cloud/Harmonizome/api/1.0) | Unified access to 177 datasets of gene and protein knowledge from Ma'ayan Lab | Free |
| [HGNC](https://rest.genenames.org) | HUGO Gene Nomenclature Committee — approved human gene symbols and names | Free |
| [HMMER](https://www.ebi.ac.uk/Tools/hmmer) | HMMER protein sequence search using profile hidden Markov models | Free |
| [HostDB](https://hostdb.org/hostdb/service) | VEuPathDB resource for host response to pathogens (human, mouse, macaque) | Free |
| [Human Cell Atlas](https://service.azul.data.humancellatlas.org) | Human Cell Atlas data portal — single-cell genomics projects and datasets | Free |
| [HuBMAP](https://search.api.hubmapconsortium.org/v3/portal) | Human BioMolecular Atlas Program — atlas of human body at single-cell resolution | Free |
| [HumanMine](https://www.humanmine.org/humanmine/service) | InterMine data warehouse for human genomics, disease, and interactions | Free |
| [Human Metabolome Database](https://hmdb.ca) | HMDB — comprehensive human metabolite and biomarker database | Free |
| [Human Phenotype Ontology](https://ontology.jax.org/api/hp) | Human Phenotype Ontology — standardized vocabulary of human phenotypic abnormalities | Free |
| [Human Protein Atlas](https://www.proteinatlas.org) | Human protein expression and localization data across tissues and cell types | Free |
| [I-TASSER](https://zhanggroup.org/I-TASSER) | I-TASSER — protein structure and function prediction server (Zhang Lab) | Free |
| [IEDB](https://query-api.iedb.org) | Immune Epitope Database — curated epitope data for immune research | Free |
| [iGEM Registry](https://igem.org/api/v1) | iGEM Registry of Standard Biological Parts — synthetic biology parts catalog | Free |
| [IGVF](https://api.data.igvf.org) | IGVF — Impact of Genomic Variation on Function consortium data portal | Free |
| [IHEC](https://epigenomesportal.ca/ihec/api/v2) | International Human Epigenome Consortium — reference epigenome datasets and metadata | Free |
| [ImmPort](https://www.immport.org/shared/api) | Immunology Database and Analysis Portal — shared immunology data | Free |
| [IMPC](https://www.ebi.ac.uk/mi/impc/solr) | International Mouse Phenotyping Consortium — phenotype data for knockout mouse lines | Free |
| [iNaturalist](https://api.inaturalist.org/v1) | iNaturalist — citizen-science biodiversity observations and taxa worldwide | Free |
| [IntAct](https://www.ebi.ac.uk/intact/ws) | Molecular interaction database — curated protein-protein interactions | Free |
| [InterPro](https://www.ebi.ac.uk/interpro/api) | Protein families, domains, and functional sites classification | Free |
| [IPD-IMGT/HLA](https://www.ebi.ac.uk/ipd/imgt/hla/api) | IPD-IMGT/HLA allele database — HLA allele sequences, nomenclature, and immunogenetics data | Free |
| [iPTMnet](https://research.bioinformatics.udel.edu/iptmnet/api) | iPTMnet — post-translational modification (PTM) knowledge base for proteins | Free |
| [ITIS](https://www.itis.gov/ITISWebService/jsonservice) | Integrated Taxonomic Information System — authoritative taxonomic information for plants, animals, fungi, and microbes | Free |
| [iTOL](https://itol.embl.de) | iTOL Interactive Tree of Life — phylogenetic tree upload, annotation, and export | Free |
| [IUCN Red List](https://apiv3.iucnredlist.org/api/v3) | IUCN Red List of Threatened Species — conservation status for 150,000+ species | API Key |
| [JASPAR](https://jaspar.elixir.no/api/v2) | JASPAR — open-access database of transcription factor binding profiles | Free |
| [KEGG](https://rest.kegg.jp) | Kyoto Encyclopedia of Genes and Genomes — pathway and molecular interaction database | Free |
| [LegumeMine](https://mines.legumeinfo.org/legumemine/service) | InterMine for legume genomics — soybean, common bean, and other legumes | Free |
| [LIPID MAPS](https://www.lipidmaps.org/rest) | LIPID MAPS Structure Database for lipid classification and structures | Free |
| [LOINC](https://fhir.loinc.org) | LOINC clinical terminology — standardized codes for lab tests, clinical observations, and measurements via FHIR | API Key |
| [LOTUS](https://lotus.naturalproducts.net/api) | Natural products database — open knowledge on natural compounds and their biological sources | Free |
| [MaizeGDB](https://www.maizegdb.org/api) | MaizeGDB — maize genetics and genomics database for corn research | Free |
| [MalaCards](https://www.malacards.org/api/v2) | MalaCards — human disease database integrating gene, variant, and pathway data | Free |
| [MassBank](https://massbank.eu/MassBank/api) | Public repository of mass spectra for metabolite identification | Free |
| [MeSH](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Medical Subject Headings vocabulary for indexing biomedical literature | Free |
| [MetaboLights](https://www.ebi.ac.uk/metabolights/ws) | EMBL-EBI database for metabolomics experiments and derived information | Free |
| [MetExplore](https://metexplore.toulouse.inrae.fr/metexplore-api) | MetExplore — metabolic network analysis platform with 349 organism models | Free |
| [Metabolomics Workbench](https://www.metabolomicsworkbench.org/rest) | Metabolomics Workbench — metabolomics data repository and metadata | Free |
| [METLIN](https://metlin.scripps.edu/rest/api) | METLIN metabolite mass spectrometry database for metabolomics research | API Key |
| [MG-RAST](https://api.mg-rast.org) | MG-RAST — metagenomics analysis and annotation server for microbiome datasets | Free |
| [MGnify](https://www.ebi.ac.uk/metagenomics/api/v1) | MGnify — EBI metagenomics analysis and archiving platform | Free |
| [MicrobiomeDB](https://microbiomedb.org/mbio/service) | MicrobiomeDB — microbiome study data including taxonomic and functional profiling | Free |
| [MobiDB](https://mobidb.org/api) | Protein disorder and mobility annotations | Free |
| [ModelSEED](https://modelseed.org/api/v2) | ModelSEED — automated metabolic model reconstruction and biochemistry database | Free |
| [Monarch Initiative](https://api.monarchinitiative.org/v3/api) | Knowledge graph integrating biological and clinical data for disease discovery | Free |
| [Movebank](https://www.movebank.org/movebank/service/direct-read) | Movebank — animal tracking and movement data from global research studies | Free |
| [MSigDB](https://www.gsea-msigdb.org/gsea/msigdb/human) | Molecular Signatures Database — curated gene set collections for enrichment analysis | Free |
| [MyChem.info](https://mychem.info/v1) | Chemical and drug annotation query service — aggregates compound data from multiple sources | Free |
| [MyDisease.info](https://mydisease.info/v1) | Disease annotation query service — aggregates disease data from multiple sources | Free |
| [MyGene.info](https://mygene.info/v3) | Gene annotation query service — aggregated gene info from multiple sources | Free |
| [MyGeneset.info](https://mygeneset.info/v1) | Gene set query service — curated and community gene sets | Free |
| [MyVariant.info](https://myvariant.info/v1) | Variant annotation query service — aggregates genetic variant data from multiple sources | Free |
| [RENCI Name Resolution](https://name-resolution-sri.renci.org) | Translator service mapping text labels to biomedical CURIEs | Free |
| [NASA OSDR](https://osdr.nasa.gov/osdr/data) | NASA Open Science Data Repository — space biology and radiation genomics datasets | Free |
| [Natural Products Atlas](https://www.npatlas.org/api/v1) | Database of microbially-derived natural products for drug discovery | Free |
| [NatureServe](https://explorer.natureserve.org/api/data) | NatureServe Explorer — conservation status and biodiversity data for species across the Americas | API Key |
| [NCBI BioSample](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Database of biological sample metadata used in experimental assays | Free |
| [NCBI BLAST](https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi) | NCBI BLAST sequence similarity search — submit queries and retrieve alignment results | Free |
| [NCBI Datasets](https://api.ncbi.nlm.nih.gov/datasets/v2) | NCBI Datasets API v2 — modern REST interface for genes, genomes, and taxonomy | Free |
| [NCBI Gene](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Gene-specific information from NCBI Entrez Gene database | Free |
| [NCBI Nucleotide](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | GenBank and RefSeq nucleotide sequence database | Free |
| [NCBI Protein](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Protein sequence database including RefSeq, UniProt, and PDB sequences | Free |
| [NCBI SRA](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Sequence Read Archive — raw sequencing data repository | Free |
| [NCBI Taxonomy](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Taxonomic classification and nomenclature database | Free |
| [NCBO Annotator](https://data.bioontology.org) | NCBO Annotator — annotate biomedical text with ontology concepts and get ontology recommendations | API Key |
| [NCI Chemical Identifier Resolver](https://cactus.nci.nih.gov/chemical/structure) | NCI CADD Chemical Identifier Resolver — convert between chemical names, SMILES, InChI, and other formats | Free |
| [NDEx](https://www.ndexbio.org/v2) | NDEx Network Data Exchange for biological network models | Free |
| [Nextstrain](https://nextstrain.org) | Real-time tracking of pathogen evolution for influenza, SARS-CoV-2, and other viruses | Free |
| [NMDC](https://api.microbiomedata.org) | National Microbiome Data Collaborative — integrated microbiome multi-omics data | Free |
| [RENCI Node Normalization](https://nodenormalization-sri.renci.org) | Translator service normalizing CURIEs to canonical identifiers | Free |
| [NetMHCIIpan](https://services.healthtech.dtu.dk/api) | NetMHCIIpan 4.3 — MHC class II binding prediction for peptides across HLA-DR/DP/DQ alleles | Free |
| [NetMHCpan](https://services.healthtech.dtu.dk/api) | NetMHCpan 4.1 — MHC class I binding prediction for peptides across HLA alleles | Free |
| [OBIS](https://api.obis.org/v3) | Ocean Biodiversity Information System — marine species occurrence and distribution data | Free |
| [OBO Foundry](https://obofoundry.org/registry) | Registry of 267 interoperable biomedical ontologies (GO, HPO, ChEBI, etc.) | Free |
| [OLS](https://www.ebi.ac.uk/ols4/api) | Ontology Lookup Service — search and browse biomedical ontologies (GO, EFO, HPO, etc.) | Free |
| [OMA](https://omabrowser.org/api) | Orthologous Matrix — comprehensive ortholog database | Free |
| [OMIM](https://api.omim.org/api) | Online Mendelian Inheritance in Man — catalog of human genes and genetic disorders | API Key |
| [Ontobee](https://ontobee.org/api) | Ontology term search and browsing across OBO and OWL ontologies | Free |
| [OmniPath](https://omnipathdb.org) | OmniPath — comprehensive signaling network and enzyme-substrate interactions | Free |
| [OncoTree](https://oncotree.mskcc.org/api) | MSK Cancer Classification — standardized cancer type taxonomy and hierarchy | Free |
| [OneZoom](https://www.onezoom.org/api/v1) | OneZoom tree of life explorer — interactive visualization and species search across the tree of life | Free |
| [Open Targets](https://api.platform.opentargets.org/api/v4/graphql) | Drug target identification and prioritization platform | Free |
| [Open Tree of Life](https://api.opentreeoflife.org/v3) | Open Tree of Life — comprehensive phylogenetic tree and taxonomy synthesis | Free |
| [OpenAlex](https://api.openalex.org) | OpenAlex — open catalog of scholarly works, authors, institutions, and concepts | Free |
| [OpenCitations](https://opencitations.net/index/coci/api/v1) | OpenCitations COCI citation index — open bibliographic citation data for DOIs | Free |
| [openFDA](https://api.fda.gov) | Open-access FDA data on drugs, devices, and foods including adverse events | Free |
| [ORCID](https://pub.orcid.org/v3.0) | ORCID — persistent researcher identifiers linking authors to works and affiliations | Free |
| [Orphanet](https://api.orphacode.org) | Orphanet — reference portal for rare diseases and orphan drugs | Free |
| [OrthoDB](https://data.orthodb.org/v12) | Hierarchical catalog of orthologs — gene evolutionary relationships | Free |
| [PANTHER](https://pantherdb.org/services/oai/pantherdb) | PANTHER — protein classification, gene ontology, and phylogenetic analysis | Free |
| [Pathway Commons](https://www.pathwaycommons.org/pc2) | Integrated biological pathway and interaction data from multiple sources | Free |
| [PDBe](https://www.ebi.ac.uk/pdbe/api) | Protein Data Bank in Europe — macromolecular structure data | Free |
| [PDBe Graph API](https://www.ebi.ac.uk/pdbe/graph-api) | PDBe Graph API — compounds, protein mappings, and molecule details from PDB | Free |
| [PDBj](https://pdbj.org/rest/newweb) | Protein Data Bank Japan — PDB search, SQL queries, and chemical component lookup | Free |
| [PGS Catalog](https://www.pgscatalog.org/rest) | Polygenic Score Catalog — risk prediction scores and trait associations | Free |
| [Proteomic Data Commons](https://proteomic.datacommons.cancer.gov/graphql) | NCI Proteomic Data Commons — proteomics data from cancer research studies | Free |
| [PeptideAtlas](https://db.systemsbiology.net/sbeams/cgi/PeptideAtlas) | PeptideAtlas — proteomics data repository for peptide and protein identifications | Free |
| [Pfam](https://www.ebi.ac.uk/interpro/api) | Pfam protein families database — protein domain classification via InterPro | Free |
| [Pharos](https://pharos-api.ncats.io/graphql) | Illuminating the Druggable Genome — comprehensive target, disease, and ligand knowledge base | Free |
| [PharmVar](https://www.pharmvar.org/api-service) | Pharmacogene Variation Consortium — pharmacogenomic variant alleles for CYP enzymes | API Key |
| [PharmGKB (CPIC)](https://api.cpicpgx.org/v1) | CPIC pharmacogenomics knowledge base — drug-gene pairs, clinical guidelines, and pharmacogenomic recommendations | Free |
| [PhyloT](https://phylot.biobyte.de/api) | PhyloT — taxonomy-based phylogenetic tree generation from NCBI taxon IDs | Free |
| [pkCSM](https://biosig.lab.uq.edu.au/pkcsm) | pkCSM pharmacokinetics and toxicity prediction using graph-based signatures | Free |
| [Planteome](https://planteome.org/api) | Planteome — plant trait ontologies and gene annotations for plant biology | Free |
| [PlasmoDB](https://plasmodb.org/plasmo/service) | VEuPathDB resource for Plasmodium (malaria parasite) genomics | Free |
| [PomBase](https://www.pombase.org/api/v1/dataset/latest) | S. pombe genome database — fission yeast genetics and genomics | Free |
| [PRIDE](https://www.ebi.ac.uk/pride/ws/archive/v2) | PRIDE proteomics archive — mass spectrometry proteomics data repository | Free |
| [Progenetix](https://progenetix.org/beacon) | Cancer genomics with copy number variation data across tumor types | Free |
| [ProteomeXchange](https://proteomecentral.proteomexchange.org/cgi) | Centralized proteomics dataset repository linking PRIDE, MassIVE, and other archives | Free |
| [PubChem](https://pubchem.ncbi.nlm.nih.gov/rest/pug) | Open chemistry database with compound, substance, and bioassay data | Free |
| [PubMed](https://eutils.ncbi.nlm.nih.gov/entrez/eutils) | Biomedical literature search engine (NCBI) | Free |
| [PubTator](https://www.ncbi.nlm.nih.gov/research/pubtator3-api) | PubTator3 biomedical text mining — named entity recognition and annotation of PubMed articles | Free |
| [QuickGO](https://www.ebi.ac.uk/QuickGO/services) | Gene Ontology browser — fast access to GO term information (EBI) | Free |
| [RCSB PDB](https://data.rcsb.org) | Protein Data Bank — 3D structural data for biological macromolecules | Free |
| [Reactome](https://reactome.org) | Curated biological pathway and reaction database | Free |
| [RegulomeDB](https://regulomedb.org) | RegulomeDB — annotate and score regulatory variants in the human genome | Free |
| [Rfam](https://rfam.org) | Database of non-coding RNA families and structured RNA elements | Free |
| [Rhea](https://www.rhea-db.org/rhea) | Expert-curated knowledgebase of biochemical reactions | Free |
| [RNAcentral](https://rnacentral.org/api/v1) | RNAcentral — comprehensive non-coding RNA sequence database | Free |
| [ROR](https://api.ror.org/v2) | Research Organization Registry — identifying research institutions worldwide | Free |
| [RxNorm](https://rxnav.nlm.nih.gov/REST) | NLM drug terminology for normalized drug names and interactions | Free |
| [SABIO-RK](https://sabiork.h-its.org/sabioRestWebServices) | SABIO-RK enzyme kinetics database — reaction kinetics data and parameters | Free |
| [Semantic Scholar](https://api.semanticscholar.org/graph/v1) | Semantic Scholar academic paper search — find research papers, citations, and author information | API Key |
| [SGD](https://www.yeastgenome.org/backend) | Saccharomyces Genome Database — yeast genomics | Free |
| [SigCom LINCS](https://maayanlab.cloud/sigcom-lincs/metadata-api) | Signatures of perturbation from the LINCS L1000 gene expression project | Free |
| [SignalP 6.0](https://api.biolib.com/app/DTU/SignalP-6.0) | SignalP 6.0 — signal peptide prediction for protein sequences (DTU BioLib) | Free |
| [SIGNOR](https://signor.uniroma2.it/API) | SIGNOR — signaling network open resource for causal interactions in signaling pathways | Free |
| [Single Cell Portal](https://singlecell.broadinstitute.org/single_cell/api/v1) | Broad Institute Single Cell Portal — explore and share single-cell genomics studies | Free |
| [SNOMED CT](https://tx.fhir.org/r4) | SNOMED CT clinical terminology via FHIR terminology server — look up and search clinical concepts | Free |
| [STITCH](http://stitch-db.org/api) | STITCH chemical-protein interaction database — sister project of STRING | Free |
| [STRING](https://string-db.org/api) | Protein-protein interaction network database | Free |
| [SureChEMBL](https://www.surechembl.org/api) | Patent chemistry database linking chemical structures to patent documents | Free |
| [SwissADME](http://www.swissadme.ch) | SwissADME drug-likeness and pharmacokinetics prediction tool | Free |
| [SWISS-MODEL](https://swissmodel.expasy.org) | SWISS-MODEL Repository — homology models and 3D protein structure predictions | Free |
| [SwissLipids](https://www.swisslipids.org/api) | SwissLipids — curated knowledge resource for lipid biology and lipidomics | Free |
| [TargetMine](https://targetmine.mizuguchilab.org/targetmine/service) | Integrated data warehouse for drug target prioritization and biomarker discovery | Free |
| [TCIA](https://services.cancerimagingarchive.net/nbia-api/services/v1) | The Cancer Imaging Archive — public access to cancer medical imaging data and collections | Free |
| [TimeTree](https://timetree.org/api) | TimeTree — divergence time estimates between species pairs | Free |
| [ToxCast](https://comptox.epa.gov/dashboard/api) | EPA ToxCast high-throughput toxicity assay screening data | Free |
| [ToxoDB](https://toxodb.org/toxo/service) | VEuPathDB resource for Toxoplasma gondii and related apicomplexan genomics | Free |
| [TriTrypDB](https://tritrypdb.org/tritrypdb/service) | VEuPathDB resource for trypanosomatid genomics (Trypanosoma, Leishmania) | Free |
| [UCSC Genome Browser](https://api.genome.ucsc.edu) | UCSC Genome Browser — genome assemblies, annotations, and track data | Free |
| [UCSC Genome Browser API](https://api.genome.ucsc.edu) | Programmatic access to genome search, sequences, tracks, and browser data | Free |
| [UMLS](https://uts-ws.nlm.nih.gov/rest) | Unified Medical Language System — biomedical concepts, terminology crosswalk, and semantic network | API Key |
| [UniCarb-DB](https://unicarb-db.expasy.org/api) | UniCarb-DB — glycan structure database with experimentally determined carbohydrate structures | Free |
| [UniChem](https://www.ebi.ac.uk/unichem/api/v1) | UniChem compound cross-referencing — map chemical identifiers across databases | Free |
| [UniParc](https://rest.uniprot.org/uniparc) | UniProt Archive — comprehensive non-redundant protein sequence archive | Free |
| [UniProt](https://rest.uniprot.org) | Universal Protein Resource — protein sequence and functional information | Free |
| [UniRef](https://rest.uniprot.org/uniref) | UniProt Reference Clusters — clustered sets of related protein sequences | Free |
| [USDA NASS](https://quickstats.nass.usda.gov/api) | USDA National Agricultural Statistics Service — US crop, livestock, and agricultural census data | API Key |
| [VDJdb](https://vdjdb.cdr3.net/api) | VDJdb — curated database of T-cell receptor sequences and specificities | Free |
| [VEuPathDB](https://veupathdb.org/veupathdb/service) | Eukaryotic pathogen genomics — Plasmodium, Toxoplasma, Cryptosporidium, and more | API Key |
| [VertNet](http://api.vertnet-portal.appspot.com/api) | VertNet — vertebrate specimen records from natural history collections worldwide | Free |
| [WHO Global Health Observatory](https://ghoapi.azureedge.net/api) | WHO Global Health Observatory — global health indicators, statistics, and country-level health data | Free |
| [WHO ICD-11](https://id.who.int/icd) | WHO ICD-11 International Classification of Diseases — search and retrieve disease classifications | API Key |
| [Wikidata](https://query.wikidata.org) | Wikidata SPARQL endpoint — structured knowledge base for genes, proteins, diseases, drugs, and species | Free |
| [WikiPathways](https://cdn.jsdelivr.net/gh/wikipathways/wikipathways-assets@main) | Open biological pathway database — community-curated pathway data | Free |
| [WormBase](https://www.alliancegenome.org/api) | WormBase C. elegans and nematode genomics via the Alliance of Genome Resources API | Free |
| [WoRMS](https://www.marinespecies.org/rest) | World Register of Marine Species — authoritative classification and nomenclature of marine organisms | Free |
| [Zenodo](https://zenodo.org/api) | Open research data repository hosted by CERN — datasets, software, and publications | Free |
| [ZFIN](https://zfin.org/action/api) | ZFIN Zebrafish Information Network — zebrafish genomics, genetics, and phenotype data | Free |
| [ZINC](https://zinc15.docking.org) | Free database of commercially available compounds for virtual screening | Free |
| [Zooma](https://www.ebi.ac.uk/spot/zooma/v2/api) | EBI annotation tool mapping free text to ontology terms | Free |

## Example Queries

### Beginner

| Role | Category | Query |
|------|----------|-------|
| Rotation Student | Variant lookup | *My PI handed me rs1801133 and said "look it up" — what gene is it in, what does dbSNP say, what's the clinical significance in ClinVar, and what associated phenotypes does MyVariant.info return?* |
| Veterinary Student | Cross-species gene | *We're studying FGF5 in cats for coat length — does the same gene exist in dogs and horses, what phenotypes are associated, and is there a protein structure I can look at?* |
| New Lab Technician | Reagent sourcing | *I need a plasmid with human EGFP-tagged LC3B for an autophagy assay — is there one on Addgene, what's the backbone, and has anyone published with it recently?* |
| MPH Student | Disease coding | *My supervisor asked me to pull ICD-11 codes for all maternal mortality causes — what codes map to obstetric hemorrhage, eclampsia, and sepsis, and how do those map to SNOMED CT terms?* |
| Ecology Field Assistant | Species reporting | *I photographed what I think is a Painted Bunting in Vermont in December — has eBird ever recorded one there this late, and is that within the known range for this species on GBIF?* |
| Pharmacy Intern | Drug label | *A patient is asking about the black box warning on fluoroquinolones — what does the current DailyMed label say for ciprofloxacin, and how many FDA adverse events have been reported for tendon rupture?* |
| Undergrad Researcher | Protein domains | *I'm annotating a hypothetical protein from a soil metagenome — what InterPro domains does the closest UniProt hit contain, and which Pfam families match?* |
| Clinical Data Analyst | Lab code mapping | *We're migrating EHR systems and need to map our internal CBC panel to LOINC codes — what are the standard LOINC codes for WBC, RBC, hemoglobin, hematocrit, and platelets?* |
| Marine Biology Intern | Specimen ID | *We trawled up a fish larva off the coast of Belize and can't ID it morphologically — can I match its COI barcode in BOLD, and if I get a species hit, what does FishBase say about its ecology?* |
| Grad Student (Immunology) | Antigen lookup | *I'm cloning a T-cell receptor that recognizes an EBV epitope — what GLCTLVAML-restricted TCR sequences are in VDJdb, and which HLA allele presents that peptide?* |
| Conservation Volunteer | Threat assessment | *I'm writing a grant about freshwater mussels in the Tennessee River — which species in that region are IUCN Red Listed, and are any of them in NatureServe's critically imperiled category?* |
| Bioinformatics Trainee | Data discovery | *My advisor wants single-cell RNA-seq data from human pancreatic islets for a reanalysis — what datasets are available on CELLxGENE and GEO, and how many cells were sequenced in each?* |

### Intermediate

| Role | Category | Query |
|------|----------|-------|
| Clinical Geneticist | Diagnostic odyssey | *A 4-year-old presents with progressive cerebellar ataxia, oculomotor apraxia, and elevated alpha-fetoprotein — the exome found a VUS in SETX. Is this gene-disease association validated in ClinGen, what does OMIM say about AOA2, how many pathogenic SETX variants are in ClinVar, and does the variant's CADD score support pathogenicity?* |
| Pharma Target Scientist | Target deconvolution | *Our phenotypic screen hit a compound that reverses fibrosis in hepatic stellate cells but we don't know the target. The compound's SMILES is known — what structurally similar compounds exist in PubChem, which known targets do those share in DGIdb, which of those targets are expressed in liver (GTEx), and do any have existing tool compounds in ChEMBL with known mechanism of action?* |
| Conservation Geneticist | Population decline | *The vaquita (Phocoena sinus) is down to ~10 individuals — what's its taxonomic placement in WoRMS, are there any genomic resources in NCBI SRA, what does the IUCN assessment say about inbreeding depression, and have any recent papers in Europe PMC modeled its minimum viable population?* |
| Microbiome Researcher | Gut-liver axis | *Patients with NAFLD have elevated plasma levels of trimethylamine N-oxide (TMAO) — what is TMAO's HMDB entry, which gut bacterial genera produce TMA (its precursor), are there metagenomic studies in MicrobiomeDB comparing NAFLD vs. healthy gut composition, and what host genes in the FMO3 pathway convert TMA to TMAO?* |
| Drug Safety Scientist | Signal detection | *Dupilumab (Dupixent) was approved for atopic dermatitis but we're seeing unexpected arthralgia reports — how many adverse events for dupilumab + arthralgia are in openFDA, what's the drug's mechanism in Guide to Pharmacology, does IL4R (its target) have known roles in joint biology via Open Targets, and are there any ongoing trials adding musculoskeletal endpoints?* |
| Functional Genomicist | Regulatory variant | *GWAS hit rs6983267 at 8q24 is associated with colorectal cancer but sits in a gene desert — is it in an ENCODE cCRE (SCREEN), what transcription factor ChIP-seq peaks overlap it, does RegulomeDB score it as likely functional, and which gene does the region physically contact in Hi-C data from ENCODE?* |
| Plant Breeder | Trait mapping | *We mapped a QTL for submergence tolerance in rice to chromosome 9 — what genes are in that interval in Gramene, is SUB1A annotated there, what Pfam domains does the protein have, and are there orthologs in maize (MaizeGDB) that might confer flooding tolerance?* |
| Infectious Disease Fellow | Resistance profiling | *A patient's Klebsiella pneumoniae isolate is carbapenem-resistant — what are the known carbapenemase gene families (KPC, NDM, OXA-48) in the Conserved Domain Database, which plasmid vectors carry them in NCBI Nucleotide, and what does the latest CDC WONDER data show about CRE incidence trends in my state?* |
| Metabolomics Core Manager | Unknown feature | *LC-MS/MS flagged an unknown peak at m/z 298.0973 [M+H]+ in cerebrospinal fluid — what candidate structures does METLIN return for that exact mass, do any match known CSF metabolites in HMDB, and can ClassyFire classify the top candidate's chemical taxonomy?* |
| Structural Biologist | Cryo-EM planning | *I want to solve the structure of human TRPV1 in complex with capsaicin — what existing structures are in PDB (resolution, method), which EMDB maps are available for TRPV1, what AlphaFold confidence score does the ligand-binding region have, and are there related EMPIAR raw datasets I could reprocess?* |
| Immuno-oncologist | Checkpoint landscape | *I'm designing a combination immunotherapy trial for MSI-high colorectal cancer — which immune checkpoint genes are overexpressed in CRC vs. normal colon in GTEx, what epitopes from common CRC neoantigens are in IEDB, which checkpoint inhibitors are in active CRC trials on ClinicalTrials.gov, and what are the reported adverse event rates for the combination in openFDA?* |
| Disease Modeler | Zoonotic spillover | *Nipah virus keeps spilling over from Pteropus bats in Bangladesh — what Pteropus species occur there according to GBIF, what's their IUCN conservation status, what host-pathogen interaction papers exist in PubMed, and does the WHO GHO track Nipah case counts by year?* |
| Computational Chemist | Scaffold hopping | *I have a pyrimidine-based EGFR inhibitor with hERG liability — what structurally similar compounds in PubChem don't have the problematic substructure, do any have binding data in BindingDB against EGFR, and what does SwissADME predict for their cardiac safety profile?* |
| Rare Disease Parent | Self-advocacy | *My daughter was diagnosed with Aicardi-Goutières syndrome (AGS) — what genes cause it according to OMIM, which specific variants are pathogenic in ClinVar, are there any clinical trials she might qualify for, and does GARD have information about patient support organizations?* |
| Agricultural Epidemiologist | Crop surveillance | *Soybean yields dropped 15% in Iowa this year while neighboring states are stable — what does USDA NASS data show for Iowa soybean production over the last 5 years, are there GBIF occurrence records for soybean cyst nematode (Heterodera glycines) in that region, and have any recent papers in Semantic Scholar described new virulent SCN populations?* |

### Expert

| Role | Category | Query |
|------|----------|-------|
| Tumor Board Molecular Pathologist | Somatic interpretation | *A pancreatic adenocarcinoma patient's tumor has KRAS G12D, a TP53 splice-site variant, and CDKN2A homozygous deletion. For each: pull the ClinVar clinical significance and CIViC evidence level, check which are targetable via DGIdb, check cBioPortal for KRAS G12D mutation frequency across pancreatic cancer studies, see if KRAS G12D has an approved or trial-stage inhibitor in ChEMBL (sotorasib is G12C-specific — is there anything for G12D?), and find open basket trials on ClinicalTrials.gov that accept KRAS G12D.* |
| Pharmacometrician | DDI modeling | *A transplant patient on tacrolimus is starting posaconazole for fungal prophylaxis — tacrolimus is a CYP3A4/5 substrate and posaconazole is a strong 3A4 inhibitor. Pull the enzyme data from PharmGKB, get the Ki values for posaconazole inhibition of CYP3A4 from BindingDB, check openFDA for co-reported adverse events of this pair, find the DailyMed label's dose adjustment language, and see if any CPIC guidelines exist for CYP3A5 poor metabolizers on tacrolimus.* |
| Marine Spatial Planner | MPA design | *We're proposing a marine protected area in the Coral Triangle — pull OBIS occurrence records for threatened reef-building corals in that bounding box, cross-reference species against IUCN Red List status, check AquaMaps predicted distributions for key species under climate scenarios, get GBIF records for commercially fished species that overlap the proposed boundary, and find recent Semantic Scholar papers modeling MPA effectiveness in that region.* |
| Neoantigen Pipeline Developer | Vaccine design | *I have a list of 50 somatic missense mutations from a melanoma exome — for each mutation: get the wild-type protein sequence from UniProt, generate 8-11mer peptides spanning the mutation, predict MHC-I binding for the patient's HLA-A*02:01 using NetMHCpan, check if any predicted strong binders match known IEDB epitopes (possible cross-reactivity concern), verify the mutated gene is expressed in melanoma via Human Protein Atlas, and estimate deleteriousness via CADD to prioritize likely functional neoantigens.* |
| Antimicrobial Stewardship Lead | Resistance surveillance | *Our hospital is seeing a cluster of vancomycin-resistant Enterococcus — pull the vanA and vanB gene domain architecture from CDD, search for the resistance operon in NCBI Nucleotide to identify plasmid vs. chromosomal context, check what CDC WONDER reports for VRE bloodstream infection mortality trends nationally, get the WHO GHO AMR surveillance data for our region, find AIRR-seq datasets for VRE-infected patients to understand immune repertoire responses, and check if there are any active clinical trials for new anti-VRE agents.* |
| Multi-omics Data Integrator | Pan-cancer CNA | *I'm building copy-number alteration signatures across cancer types — pull GDC's available TCGA project IDs with SNP array data, for a test gene like CCND1 get its genomic coordinates from Ensembl, check cBioPortal for amplification frequency across cancer types, cross-reference amplified cases against drug sensitivity in DepMap, see which amplification-associated drugs exist in DGIdb, and get the latest Sigminer or CNA signature papers from OpenAlex.* |
| Clinical Informatics Architect | Terminology bridge | *We're building a phenotype-to-genotype pipeline and need to bridge clinical coding systems — for "type 2 diabetes mellitus" walk the full chain: get the ICD-11 entity, find the SNOMED CT concept via UMLS crosswalk, map to HPO phenotype terms, link to OMIM phenotype entries, find associated genes, then verify those genes have ClinGen gene-disease validity scores. Show me every ID at each step so I can validate the chain.* |
| Synthetic Biology Postdoc | Pathway debugging | *I'm engineering E. coli to produce naringenin via the phenylpropanoid pathway but titers are low — pull the full pathway from KEGG (phenylalanine to naringenin), get Km and kcat values for each enzyme from SABIO-RK, check which steps have known bottlenecks in the literature (Semantic Scholar), find codon-optimized parts for TAL and 4CL in the iGEM registry, see if there's a genome-scale model of the chassis strain in BiGG, and check if anyone has deposited a working naringenin construct on Addgene.* |
| Conservation Genomicist | Extinction risk | *The Chinese pangolin (Manis pentadactyla) is critically endangered and we want to assess genetic diversity — get the IUCN assessment and threat data, search NCBI SRA for any whole-genome sequencing datasets, check BOLD for available DNA barcodes and haplotype diversity, find GBIF occurrence records to map remaining populations, get the species' evolutionary divergence time from TimeTree relative to other pangolin species, and search bioRxiv for any unpublished population genetics work.* |
| Translational Neuroscientist | Target validation | *TREM2 variants keep appearing in Alzheimer's GWAS — pull the lead variant rs75932628 from gnomAD for population frequencies, check its CADD score and Ensembl VEP annotation, look up TREM2 expression across brain regions in GTEx and Allen Brain Atlas, get the protein interaction partners from STRING, find which microglia-specific single-cell datasets in CELLxGENE express TREM2, see what drugs target the TREM2 pathway in Open Targets, and check BrainSpan for developmental expression patterns that might explain age-of-onset.* |
| One Health Epidemiologist | Spillover risk | *H5N1 avian influenza was detected in US dairy cattle herds — pull eBird recent observations of waterfowl in affected counties, check GBIF for migratory flyway overlap with cattle farm locations, get the HA protein sequence of recent cattle-adapted H5N1 from NCBI Protein, compare it against known human-adapted epitopes in IEDB, search ClinicalTrials.gov for H5N1 vaccine trials, and check CDC WONDER for any reported human H5 cases in those states.* |
| Glycoproteomics Researcher | Site-specific glycosylation | *I'm studying site-specific glycosylation of SARS-CoV-2 spike protein — get the spike sequence from UniProt (P0DTC2), find all experimentally observed glycan structures on spike in GlyCosmos, map the N-glycosylation sites to AlphaFold's predicted structure to see which are surface-exposed, check if those sites are conserved across sarbecovirus orthologs in OrthoDB, and find PRIDE proteomics datasets where spike glycopeptides were identified.* |

## License

MIT — see [LICENSE](LICENSE).
