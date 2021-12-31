# kendall_gmaps

Parses a tsv file and drops pins on google maps for each entry. Each entry can contain data which is displayed on a popup at the pin:
* Name of the school district
* Current bond issuer
* Future issue date
* Last contacted date
* Notes

Pins can be colored one of two ways, either by current provider, or by days till future bond issue.


TODO:
* Sometimes google response time is bad. we should add icons async, we don't need to wait for each
* Latlong should be cached to a file to save gmap calls.


