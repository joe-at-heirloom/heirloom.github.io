# Pottery mark pictures: sources and checks (Nov 22 2026)

These are the pictures on the five pottery pages under /marks/. `p_pottery.py` generates the pages, and the images are in `marks/img/` (`p-*` for photographs, `f-*` for book facsimiles). The years come from the app's `pottery.json` at origin/main, and every picture was checked against that table. Where a book disagrees with the table, the page keeps the table's year and notes what the book printed.

The working files are kept outside the repo, in the session notes folder under `pottery-sources/`. They are the source scans, the downloaded photos, the crop scripts (`ink.py`, `autocrop.py`, `export.py`, `minton_crop.py`) and a Minton contact sheet. The Met photos are Wikimedia Commons' standard 960 or 1280 px thumbnails, because Commons answers 429 to scripted requests for other sizes.

## Real photographs

| File | What it shows | Reads as (table) | Source and licence |
|---|---|---|---|
| p-vincennes-dot | Interlaced Ls with a dot, no letter | Before the date letters (Met: c. 1751) | Met LC-1989.351.1, wine cooler, Vincennes. [Commons](https://commons.wikimedia.org/wiki/File:Wine_cooler_(seau_%C3%A0_demi-bouteille)_(one_of_a_pair)_MET_LC-1989_351_1-marks.jpg). Met Open Access, CC0 |
| p-sevres-h | Ls with H, a cross below | H = 1761 revised, 1760 traditional (Met: 1761) | Met SF2007.90.8a,b. [Commons](https://commons.wikimedia.org/wiki/File:Vase_(Vase_hollandois)_MET_SF2007_90_8a,_b_mark.jpg). CC0 |
| p-sevres-s | Ls with S, painter LB | S = 1771 (Met: 1771) | Met SF64.174.59a. [Commons](https://commons.wikimedia.org/wiki/File:Cup_with_cover_(pot_%C3%A0_jus)_MET_SF64_174_59a_mark.jpg). CC0 |
| p-sevres-t | Ls with T, k (Dodin) below | T = 1772 (Met: 1772) | Met SF58.75.73ab. [Commons](https://commons.wikimedia.org/wiki/File:Vase_with_cover_(vase_%C3%A0_flacon)_(one_of_a_pair)_MET_SF58_75_73ab_marks.jpg). CC0 |
| p-sevres-z | Ls with Z, "Dodin 1777", k | Z = 1777 (Met: 1777, and the painter wrote it) | Met SF1988.179. [Commons](https://commons.wikimedia.org/wiki/File:Themire_Crowned_by_Graces_MET_SF1988_179_mark.jpg). CC0 |
| p-worcester-n | Crowned circle, N below | N = 1878 (Met: 1878) | Met LC-2018.62.72. [Commons](https://commons.wikimedia.org/wiki/File:Moon_flask_MET_LC-2018_62_72-marks.jpg). CC0 |
| p-worcester-p | Crowned circle, faint P below | P = 1879 (Met: 1879) | Met LC-2018.62.103. [Commons](https://commons.wikimedia.org/wiki/File:Orb_bottom_vase_with_white_and_gold_crane_motif_MET_LC-2018_62_103-marks.jpg). CC0. The bowl of the P is weakly printed; the Met's date agrees. |
| p-worcester-x | Crowned circle, X below | X = 1886 (Met: c. 1886; registered design 25570 is from 1885) | Met LC-2018.62.108. [Commons](https://commons.wikimedia.org/wiki/File:Vase_MET_LC-2018_62_108-marks.jpg). CC0. Slightly blurred. |
| p-minton-1867 | Impressed MINTON and a cypher | 1867, an A with crossed legs (Met: c. 1867) | Met LC-2016.178.1. [Commons](https://commons.wikimedia.org/wiki/File:Vase_MET_LC-2016_178_1-marks.jpg). CC0. A cross with four dots sits beside the cypher, and the page calls it "not a year mark". |
| p-wedgwood-impressed | Impressed WEDGWOOD | No date code (Met: c. 1780) | Met SF2014.712.9. [Commons](https://commons.wikimedia.org/wiki/File:Platter_MET_SF2014_712_9_mark.jpg). CC0 |
| p-rookwood-xxx | RP with 14 flames, XXX, 80C | XXX = 1930 | Y.paulsen. [Commons](https://commons.wikimedia.org/wiki/File:Rookwood_Pottery_vase,_Lorinda_Epply,_1930,_Markings.jpg). CC0 |

The photos are tight crops, not cut out. All except the Minton (black body) and the Wedgwood (cream glaze) are white-balanced to one shared paper tone.

## Public-domain book facsimiles

Each crop is converted to ink on a transparent background. Alpha comes from darkness, every crop uses the same ink color, and specks away from the mark are removed.

- **Minton, f-minton-1842 to f-minton-1907 (66 cyphers).** From Frederick Litchfield, *Pottery and Porcelain: A Guide to Collectors* (1912), p. 289 ([archive.org](https://archive.org/details/potteryporcelain00litc/page/289)). Litchfield died in 1930. The 1925 edition (p. 252) repeats the same chart, still ending at 1907. The chart agrees with the table for 1842 to 1894 and for 1901 to 1907, except:
  - 1845: the book draws the X with knobbed ends and a ring at the crossing, where the table has "a plain X". Shown, with a note.
  - 1870: the book's M has no circle, where the table has "M inside a circle". Shown, with a note.
  - 1891: the book's shield is empty, where the table has "a shield containing the numeral 1". Shown, with a note.
  - **The 1895 to 1900 swans run a year later in the book.** The book has a plain swan for 1895, a swan with a dot for 1896, then swans with 2, 3, 4 and 5 for 1897 to 1900. Litchfield's text also says 1900 is "a duck having the figure 5". The table has swans with 1 to 6 for 1895 to 1900. The page shows the book's swans with 2 to 5 on the table's years 1896 to 1899, each with a note giving the book's year. The plain swan and the swan with a dot are not used, so table years 1895 and 1900 have no picture.
- **Sèvres, f-sevres-a, f-sevres-d, f-sevres-u-crown, f-sevres-aa.** From William Burton and R. L. Hobson, *Handbook of Marks on Pottery and Porcelain* (1909), p. 77 ([archive.org](https://archive.org/details/handbookofmarkso00burt/page/77)). Both authors died in 1941. The book's A (1753) and D (1756) match the table's traditional years. Its U (1772) and AA (1777) are a year earlier than both of the table's columns (1773 and 1778), because the list on its p. 78 has no J. The page shows these four marks in a row of their own, with the book's years and that explanation.
- **Rookwood, f-rookwood-1882, f-rp-1886, f-rp-1887, f-rp-1900, f-rp-1901.** From Edwin AtLee Barber, *Marks of American Potters* (1904), p. 120 ([archive.org](https://archive.org/details/marksamericanpo00barbgoog/page/n128)). Barber died in 1916. All five years match the table.

## Still without a picture

- **Wedgwood:** no dated three-letter code anywhere. Searches covered Commons, the Met, Cooper Hewitt and the Smithsonian API, Auckland Museum, and Dutch and German search terms. The Smithsonian records describe codes in words, such as "MRGH" (1879), but have only front views. The page shows the impressed WEDGWOOD word and says no code photograph has been found.
- **Minton:** 1895, 1900, and 1908 to 1942. There is a photograph for 1867 only.
- **Royal Worcester:** photographs for N (1878), P (1879) and X (1886) only. Neither Burton & Hobson (1909) nor Chaffers (1912) has a date-code chart. Nothing yet for the two-digit years, the other letters, the dots, the stars, the shapes, the circles or the W. The page says so.
- **Rookwood:** facsimiles for 1882 to 1886, 1886, 1887, 1900 and 1901, and a photograph for 1930. Nothing for 2 to 13 flames, the other numerals or the modern marks.
- **Sèvres:** photographs for H, S, T and Z, and facsimiles for A, D, U and AA (with the book's years). Nothing for the other letters.

## Looked at and not used

- Met SF64.174.44 (Sèvres compotier, c. 1771): red Ls with no letter.
- Met LC-2018.62.71 (Royal Worcester vase): reads N, but the Met dates it 1879.
- Met LC-2018.62.96: the letter can't be read.
- Met LC-2016.178.2 (Minton bottles, Dresser): the impressed symbol can't be read.
- Met LC-2018.62.41 (MINTONS with five dots): not a known cypher.
- Davidmadelena's Minton majolica on Commons (CC BY-SA): the files are too small, and the tazza shows only the printed mark.
- Chaffers, *Marks and Monograms* (1912): says Minton's year marks "are not published by the firm" and prints no chart.
