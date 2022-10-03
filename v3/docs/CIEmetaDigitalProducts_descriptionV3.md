# CIEmetaDigitalProduct - Description

Version 3

The CIEmetaDigitalProduct meta schema is based on the most recent version of the DataCite schema (https://schema.datacite.org/meta/kernel-4.4/ ) . Additional, CIE relevant fields are defined as outlined below. The JSON schema description can be found here: https://doi.org/10.25039/CIE.SC.4taqevcd

Following points have to be considered (the ID reference to the number in the Datacite 4.4 Schema), the obligation (mandatory, recommended, option may be different to Datacite 4.4):

|ID|Property|Obligation|
|---|---|---|
|1|Identifier (with mandatory type sub-property)|M|

The standard identifier for CIE datasets is a DOI composed as following:

10.25039/CIE.DS.$$$$$$$$

$$$$$$$$ is a composition of random numbers and characterize excluding the following symbols (to avoid confusions): oOlL1I0

The DOI is typically attributed by CIE CB.

Example:

![image](https://user-images.githubusercontent.com/102721116/193686808-e8f242a4-23d2-410f-8562-faa7389b723f.png)

If a publication is translated into another language, usually same dataset is used however a "translated" metadata file may be generated, using the same number but the language code is added.


Example: "identifier":"10.25039/CIE.DS.mifmy4x4.ES"

Attention: not all terms shall be translated! In particular to JSON field names and datatableInfo (except the title and description) shall not be translated but the original english language shall be used.


|ID|Property|Obligation|
|---|---|---|
|2|Creator|M|

