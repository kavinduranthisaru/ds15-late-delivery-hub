# sources

Inputs the build scripts read (override the folder with `DS15_SOURCES`):

- `Model_Comparison_Summary.docx`: the group's 8-model comparison (committed).
- `dataset.zip`: not committed. Download "DataCo SMART SUPPLY CHAIN FOR BIG DATA ANALYSIS" (Constante, Silva and Pereira, 2019, Mendeley Data V4, https://doi.org/10.17632/8gx2fvg2k6.4, CC BY 4.0) and zip the two CSV files as `dataset.zip`. The scripts check its SHA-256 against Notebook 01's fingerprint (`fa6d022e...80aa6`, for `DataCoSupplyChainDataset.csv`).

The deployed web app does not need these files. They are only needed to rebuild the pipeline, the champion or `site_data.json`.
