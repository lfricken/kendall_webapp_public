# Financial Bond Map
Uses a spreadsheet to make a map of school districts that could use a bond issue. This code was hacked together by me in the fastest possible time.

![Error loading image. See the example.png file.](https://github.com/lfricken/kendall_webapp_public/blob/main/example.PNG "Colors are useful!")

Parses a tsv file and drops pins on google maps for each entry. Each entry can contain data which is displayed on a popup at the pin:
* Name of the school district
* Current bond issuer
* Future issue date
* Last contacted date
* Notes

Pins can be colored one of two ways, either by current provider, or by days till future bond issue.

Pins are placed based on whichever of these methods exists/works first:
1. lat/long
1. address + google maps query
1. school district + google maps query


TODO:
* Sometimes google response time is bad. we should add icons async, we don't need to wait for each
* Latlong should be cached to a file to save gmap calls.


