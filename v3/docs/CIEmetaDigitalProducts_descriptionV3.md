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

The default creator is:

![image](https://user-images.githubusercontent.com/102721116/193687301-2b21d670-b1a8-4790-bbe7-77956dc4b3d6.png)

|ID|Property|Obligation|
|---|---|---|
|3|Title (with optional type sub-properties)|M|

Usually only on title is given without sub-properties. For translated documents and additional title using the titleType "translatedType" can be used. However special characters (i.e. Chinese or russion letter) were not yet tested. 
Example:

![image](https://user-images.githubusercontent.com/102721116/193687526-5c909363-dcd2-4cef-a74c-93f994e6356c.png)


|ID|Property|Obligation|
|---|---|---|
|4|Publisher|M|

The default publisher is:
![image](https://user-images.githubusercontent.com/102721116/193687706-cc8ad87f-e665-45b9-8b2d-62b31546f827.png)

|ID|Property|Obligation|
|---|---|---|
|5|PublicationYear|M|

The year of publication of the original dataset shall be stated (in case that the related publication is translated into another language few years later than the original publication, to original publication shall be used).


|ID|Property|Obligation|
|---|---|---|
|6|Subject (with scheme sub-property)|M|

Subject, keyword, classification code, or key phrase describing the resource.
![image](https://user-images.githubusercontent.com/102721116/193688092-45a1b073-b485-4f4b-bcd2-ebfd333ce861.png)

Usually the keywords of the related publication are reused.

|ID|Property|Obligation|
|---|---|---|
|7|Contributor|O|

Usually not attributed in CIE datasets

|ID|Property|Obligation|
|---|---|---|
|8|Date|O|

Usually not attributed in CIE datasets

|ID|Property|Obligation|
|---|---|---|
|9|Language|R|

The primary language of the resource according ISO 639-1 language codes.

|ID|Property|Obligation|
|---|---|---|
|10|ResourceType|M|

For Datasets including "data tables" the ResourceTypeGeneral "Dataset" is used as the recourceType "dataTable". Other types could be "ComputationalNotebook" for excel calculation sheets, "Image", "Audiovisual ","Software",
Examples:

![image](https://user-images.githubusercontent.com/102721116/193689420-708d60e0-524b-4ed6-84f9-22d695adcf2d.png)

|ID|Property|Obligation|
|---|---|---|
|11|AlternateIdentifier (with type sub-property)|R|

For datasets, computationalnotebooks typically the filename is given:

![image](https://user-images.githubusercontent.com/102721116/193689645-cf125ac5-31b3-415b-bd4a-86b51fea98cc.png)


A short but meaningful file name shall be selected. White characters (space) shall be replaced by "_" characters. English language shall be used.

|ID|Property|Obligation|
|---|---|---|
|12|RelatedIdentifier (with type and relation type sub-properties)|R|

The identifier (DOI) of the related publication(s) shall be specified. In case of a new publication relating to the existing dataproduct, the metadatafile needs to be updated. Also the relation to other datasets can be specified, typically:
IsSupplementTo, IsSupplementedBy, HasVersion, IsVersionOf, IsNewVersionOf, IsPreviousVersionOf IsPartOf, HasPart, IsPublishedIn, IsReferencedBy, References, IsVariantFormOf, IsOriginalFormOf, IsIdenticalTo, IsDerivedFrom, IsSourceOf, IsRequiredBy Requires. 

As an example:

![image](https://user-images.githubusercontent.com/102721116/193689919-be22874b-c6c8-4a14-9275-71ec2fa6252b.png)

|ID|Property|Obligation|
|---|---|---|
|13|Size|O|

Optional, however care has to be taken that the actual size is used and not the size on the data storage (usually larger)


|ID|Property|Obligation|
|---|---|---|
|14|Format|R|

Use MIME type where possible (see https://www.iana.org/assignments/media-types/media-types.xhtml for the official definition. Alternatively the file extension can be given.
Example:
![image](https://user-images.githubusercontent.com/102721116/193690308-590e5880-9dba-4625-a18f-71b67288b070.png)

|Recommendation: The standard data format for CIE data table is CSV according RFC4180 (https://datatracker.ietf.org/doc/html/rfc4180 ), without header line. The fields are separated by comma. Other formats can be included however, a reference to the format description shall be provided|




