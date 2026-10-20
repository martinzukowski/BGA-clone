// Deep Cut prompts: geography. Same format as food-animals.js.
(window.DEEP_CUT_PROMPTS ||= []).push(
{ id: 'country-europe', cat: 'Geography', q: 'Name a country in Europe', a: `
France=1; Germany=1; Italy=1; Spain=1; United Kingdom/UK/Britain/Great Britain/England/United Kingdom of Great Britain and Northern Ireland=1;
Portugal=2; Greece=2; Ireland/Republic of Ireland/Eire=2; Netherlands/Holland=2; Belgium=2; Switzerland=2; Austria=2; Sweden=2; Norway=2; Denmark=2; Poland=2; Russia/Russian Federation=2; Finland=2;
Ukraine=2; Iceland=2;
Czechia/Czech Republic=3; Hungary=3; Romania/Rumania=3; Croatia=3; Scotland=3; Wales=3; Turkey/Turkiye=3; Serbia=3; Bulgaria=3; Slovakia=3; Luxembourg=3; Monaco=3; Malta=3; Cyprus=3;
Vatican City/Vatican/Holy See=3; Estonia=3; Latvia=3; Lithuania=3; Albania=3; Belarus/Byelorussia=3;
Slovenia=4; Bosnia and Herzegovina/Bosnia/Bosnia-Herzegovina=4; Montenegro=4; North Macedonia/Macedonia=4; Moldova=4; Andorra=4; Liechtenstein=4; San Marino=4; Kosovo=4; Northern Ireland=4;
Georgia=4; Gibraltar=4; Isle of Man=4;
Armenia=5; Azerbaijan=5; Kazakhstan=5; Faroe Islands/Faroes=5; Jersey=5; Guernsey=5; Aland Islands/Aland=5; Svalbard=5; Greenland=5` },

{ id: 'country-africa', cat: 'Geography', q: 'Name a country in Africa', a: `
Egypt=1; South Africa=1; Nigeria=1; Kenya=1; Morocco=1;
Ethiopia/Abyssinia=2; Ghana/Gold Coast=2; Madagascar=2; Algeria=2; Libya=2; Sudan=2; Tunisia=2; Somalia=2; Uganda=2; Tanzania/Tanganyika=2; Zimbabwe/Rhodesia=2; Rwanda=2;
Democratic Republic of the Congo/DR Congo/DRC/Congo/Zaire/Congo-Kinshasa/Democratic Republic of Congo=2;
Senegal=3; Cameroon=3; Mali=3; Namibia/South West Africa=3; Botswana/Bechuanaland=3; Zambia=3; Angola=3; Mozambique=3; Ivory Coast/Cote d'Ivoire=3; Niger=3; Chad=3; Sierra Leone=3; Liberia=3;
Malawi/Nyasaland=3; South Sudan=3; Gambia=3; Eritrea=3; Seychelles=3; Mauritius=3;
Burkina Faso/Upper Volta=4; Cape Verde/Cabo Verde=4; Togo=4; Benin/Dahomey=4; Gabon=4; Guinea=4; Burundi=4; Mauritania=4; Lesotho/Basutoland=4; Eswatini/Swaziland=4; Djibouti=4;
Republic of the Congo/Congo-Brazzaville/Congo Republic/Republic of Congo=4; Western Sahara=4; Zanzibar=4;
Comoros=5; Equatorial Guinea=5; Guinea-Bissau=5; Central African Republic/CAR=5; Sao Tome and Principe/Sao Tome=5; Somaliland=5; Reunion=5; Mayotte=5; Canary Islands=5; Saint Helena/St Helena=5;
Madeira=5; Ceuta=5; Melilla=5` },

{ id: 'country-asia', cat: 'Geography', q: 'Name a country in Asia', a: `
China/People's Republic of China/PRC=1; Japan=1; India=1; South Korea/Korea/Republic of Korea=1; Thailand/Siam=1; Vietnam=1;
North Korea/DPRK=2; Indonesia=2; Philippines=2; Malaysia=2; Singapore=2; Pakistan=2; Afghanistan=2; Iran/Persia=2; Iraq=2; Saudi Arabia=2; Israel=2; Nepal=2; Bangladesh=2; Sri Lanka/Ceylon=2;
Russia/Russian Federation=2; Turkey/Turkiye=2; Mongolia=2; Cambodia/Kampuchea=2; Taiwan/Republic of China=2; United Arab Emirates/UAE/Emirates=2; Syria=2;
Laos=3; Myanmar/Burma=3; Bhutan=3; Maldives=3; Qatar=3; Kuwait=3; Jordan=3; Lebanon=3; Yemen=3; Oman=3; Kazakhstan=3; Uzbekistan=3; Palestine/State of Palestine=3; Hong Kong=3;
Bahrain=4; Turkmenistan=4; Kyrgyzstan/Kirghizia=4; Tajikistan=4; Brunei=4; East Timor/Timor-Leste=4; Georgia=4; Armenia=4; Azerbaijan=4; Cyprus=4; Macau/Macao=4;
Egypt=5` },

{ id: 'country-americas', cat: 'Geography', q: 'Name a country in the Americas', a: `
United States/USA/US/America/United States of America=1; Canada=1; Mexico=1; Brazil=1; Argentina=1;
Chile=2; Colombia=2; Peru=2; Venezuela=2; Cuba=2; Jamaica=2; Ecuador=2; Bolivia=2; Uruguay=2; Paraguay=2; Panama=2; Costa Rica=2; Haiti=2; Dominican Republic=2; Puerto Rico=2; Bahamas=2; Guatemala=2;
Honduras=3; El Salvador=3; Nicaragua=3; Belize/British Honduras=3; Guyana/British Guiana=3; Suriname/Surinam/Dutch Guiana=3; Barbados=3; Trinidad and Tobago/Trinidad=3; Greenland=3;
Dominica=4; Grenada=4; Saint Lucia/St Lucia=4; Antigua and Barbuda/Antigua=4; Saint Kitts and Nevis/St Kitts and Nevis/St Kitts=4; French Guiana=4; Aruba=4; Curacao=4; Bermuda=4;
Cayman Islands/Caymans=4;
Saint Vincent and the Grenadines/St Vincent and the Grenadines/St Vincent=5; Martinique=5; Guadeloupe=5; Falkland Islands/Falklands=5; Turks and Caicos Islands/Turks and Caicos=5; Anguilla=5;
Montserrat=5; Sint Maarten=5; Bonaire=5; US Virgin Islands/Virgin Islands/United States Virgin Islands=5; British Virgin Islands/BVI=5; Saint Martin/St Martin=5;
Saint Barthelemy/St Barts/St Barths=5; Saint Pierre and Miquelon=5; Saba=5; Sint Eustatius/Statia=5; South Georgia/South Georgia and the South Sandwich Islands=5` },

{ id: 'country-oceania', cat: 'Geography', q: 'Name a country or territory in Oceania', a: `
Australia=1; New Zealand/Aotearoa=1;
Fiji=2; Papua New Guinea/PNG=2; Samoa/Western Samoa=2; Hawaii=2;
Tonga=3; Guam=3; Vanuatu/New Hebrides=3; Solomon Islands=3; French Polynesia/Tahiti=3;
New Caledonia=4; Kiribati=4; Micronesia/Federated States of Micronesia=4; Marshall Islands=4; Palau=4; Nauru=4; Tuvalu/Ellice Islands=4; Cook Islands=4; American Samoa=4; Easter Island/Rapa Nui=4;
Niue=5; Northern Mariana Islands/Northern Marianas=5; Norfolk Island=5; Pitcairn Islands/Pitcairn=5; Wallis and Futuna=5; Tokelau=5; Christmas Island=5;
Cocos Islands/Cocos (Keeling) Islands/Keeling Islands=5; Bougainville=5; Wake Island=5; Midway/Midway Atoll=5` },

{ id: 'us-state', cat: 'Geography', q: 'Name a US state', a: `
California=1; Texas=1; Florida=1; New York=1; Hawaii=1; Alaska=1;
Washington=2; Arizona=2; Nevada=2; Colorado=2; Ohio=2; Michigan=2; Illinois=2; Georgia=2; Oregon=2; Utah=2; Pennsylvania=2; Virginia=2; Massachusetts=2; New Jersey=2; North Carolina=2; Tennessee=2;
Louisiana=2; Kentucky=2; Alabama=2; Maine=2;
Montana=3; Idaho=3; Wyoming=3; New Mexico=3; Oklahoma=3; Kansas=3; Nebraska=3; Iowa=3; Missouri=3; Minnesota=3; Wisconsin=3; Indiana=3; Mississippi=3; Arkansas=3; South Carolina=3; West Virginia=3;
Maryland=3; Connecticut=3; Vermont=3; New Hampshire=3; Rhode Island=3;
North Dakota=4; South Dakota=4; Delaware=4` },

{ id: 'world-capital', cat: 'Geography', q: 'Name a capital city', a: `
London=1; Paris=1; Washington/Washington DC=1; Tokyo=1; Rome=1; Berlin=1; Madrid=1; Beijing/Peking=1; Moscow=1;
Ottawa=2; Canberra=2; Dublin=2; Athens=2; Cairo=2; Mexico City=2; Lisbon=2; Amsterdam=2; Brussels=2; Vienna=2; Stockholm=2; Oslo=2; Copenhagen=2; Helsinki=2; Warsaw=2; Prague=2; Budapest=2; Seoul=2;
Bangkok=2; New Delhi/Delhi=2; Buenos Aires=2; Edinburgh=2; Wellington=2; Kyiv/Kiev=2; Jerusalem=2; Havana=2; Lima=2;
Cardiff=3; Belfast=3; Bern=3; Brasilia=3; Santiago=3; Bogota=3; Caracas=3; Nairobi=3; Ankara=3; Tehran=3; Baghdad=3; Riyadh=3; Manila=3; Jakarta=3; Hanoi=3; Kabul=3; Islamabad=3; Kathmandu=3;
Taipei=3; Singapore=3; Kuala Lumpur=3; Reykjavik=3; Bucharest=3; Sofia=3; Belgrade=3; Zagreb=3; Bratislava=3; Ljubljana=3; Tallinn=3; Riga=3; Vilnius=3; Minsk=3; Luxembourg=3; Monaco=3; Valletta=3;
Nicosia=3; Doha=3; Abu Dhabi=3; Kuwait City=3; Beirut=3; Damascus=3; Amman=3; Pretoria=3; Cape Town=3; Abuja=3; Addis Ababa=3; Accra=3; Dakar=3; Rabat=3; Algiers=3; Tunis=3; Tripoli=3; Khartoum=3;
Kinshasa=3; Montevideo=3; Quito=3; La Paz=3; Asuncion=3; Panama City=3; San Jose=3; Kingston=3; Nassau=3; Tirana=3; Sarajevo=3; Tbilisi=3; Baku=3; Astana/Nur-Sultan=3; Ulaanbaatar/Ulan Bator=3;
Pyongyang=3; Phnom Penh=3; Dhaka=3; Kampala=3; Sacramento=3; Austin=3; Boston=3; Atlanta=3; Denver=3; Phoenix=3; Honolulu=3; Nashville=3; Salt Lake City=3; Toronto=3; Quebec City/Quebec=3; Sydney=3;
Melbourne=3;
Muscat=4; Sucre=4; Skopje=4; Podgorica=4; Chisinau=4; Pristina=4; Andorra la Vella=4; Vaduz=4; San Marino=4; Vatican City=4; Yerevan=4; Tashkent=4; Bishkek=4; Dushanbe=4; Ashgabat=4; Naypyidaw=4;
Vientiane=4; Colombo=4; Thimphu=4; Male=4; Bandar Seri Begawan=4; Dili=4; Port Moresby=4; Suva=4; Apia=4; Manama=4; Sanaa=4; Kigali=4; Dar es Salaam=4; Dodoma=4; Lusaka=4; Harare=4; Maputo=4;
Windhoek=4; Gaborone=4; Luanda=4; Antananarivo=4; Lilongwe=4; Mogadishu=4; Djibouti=4; Asmara=4; Juba=4; Bamako=4; Ouagadougou=4; Freetown=4; Monrovia=4; Abidjan=4; Yaounde=4; Brazzaville=4;
Georgetown=4; Paramaribo=4; Managua=4; Tegucigalpa=4; San Salvador=4; Guatemala City=4; Belmopan=4; Santo Domingo=4; Port-au-Prince=4; Bridgetown=4; Port of Spain=4; Albany=4; Tallahassee=4;
Springfield=4; Juneau=4; Montgomery=4; Little Rock=4; Hartford=4; Dover=4; Boise=4; Indianapolis=4; Des Moines=4; Topeka=4; Frankfort=4; Baton Rouge=4; Augusta=4; Annapolis=4; Lansing=4;
Saint Paul/St Paul=4; Jackson=4; Helena=4; Lincoln=4; Carson City=4; Concord=4; Trenton=4; Santa Fe=4; Raleigh=4; Bismarck=4; Columbus=4; Oklahoma City=4; Salem=4; Harrisburg=4; Providence=4;
Columbia=4; Montpelier=4; Richmond=4; Olympia=4; Charleston=4; Madison=4; Cheyenne=4; Edmonton=4; Regina=4; Winnipeg=4; Halifax=4; Fredericton=4; Brisbane=4; Perth=4; Adelaide=4; Hobart=4; Darwin=4;
Nuuk/Godthab=4; San Juan=4; Hamilton=4;
Sri Jayawardenepura Kotte/Kotte=5; Nuku'alofa=5; Port Vila=5; Honiara=5; Tarawa=5; Majuro=5; Palikir=5; Ngerulmud=5; Funafuti=5; Yaren=5; Maseru=5; Mbabane=5; Lobamba=5; Gitega=5; Bujumbura=5;
N'Djamena=5; Niamey=5; Nouakchott=5; Conakry=5; Bissau=5; Yamoussoukro=5; Lome=5; Porto-Novo=5; Cotonou=5; Libreville=5; Malabo=5; Bangui=5; Sao Tome=5; Praia=5; Banjul=5; Port Louis=5; Victoria=5;
Moroni=5; Cayenne=5; Castries=5; Kingstown=5; Saint George's/St George's=5; Basseterre=5; Saint John's/St John's=5; Roseau=5; Jefferson City=5; Pierre=5; Charlottetown=5; Whitehorse=5; Yellowknife=5;
Iqaluit=5; Bloemfontein=5; Putrajaya=5; Torshavn=5; Douglas=5; Saint Helier/St Helier=5; Saint Peter Port/St Peter Port=5; Gibraltar=5; Papeete=5; Noumea=5; Hagatna/Agana=5; Pago Pago=5;
Charlotte Amalie=5; Road Town=5; Oranjestad=5; Willemstad=5; Stanley=5; Mariehamn=5; Longyearbyen=5; Ramallah=5` },

{ id: 'river', cat: 'Geography', q: 'Name a river', a: `
Nile=1; Amazon=1; Mississippi=1; Thames/Isis=1;
Danube/Donau/Duna=2; Rhine/Rhein/Rijn=2; Seine=2; Yangtze/Chang Jiang=2; Ganges/Ganga/Padma=2; Colorado=2; Missouri=2; Hudson=2; Volga=2; Tiber/Tevere=2; Jordan=2; Rio Grande=2; Mekong=2; Congo=2;
Euphrates=2; Tigris=2; Yellow River/Huang He=2; Ohio=2;
Potomac=3; Indus=3; Zambezi=3; Niger=3; Columbia=3; Yukon=3; St Lawrence/Saint Lawrence=3; Mackenzie=3; Tennessee=3; Delaware=3; Snake=3; Arkansas=3; Red River=3; Rhone=3; Loire=3; Elbe=3; Oder=3;
Vistula=3; Dnieper=3; Don=3; Po=3; Arno=3; Tagus/Tejo=3; Ebro=3; Shannon=3; Severn=3; Mersey=3; Tyne=3; Clyde=3; Avon=3; Trent=3; Brahmaputra=3; Irrawaddy/Ayeyarwady=3; Murray=3; Orinoco=3; Parana=3;
Limpopo=3; Blue Nile=3; White Nile=3; Rubicon=3; Kwai/River Kwai/Khwae Noi=3;
Darling=4; Okavango=4; Orange=4; Ob=4; Yenisei=4; Lena=4; Amur=4; Ural=4; Dniester=4; Neva=4; Moselle=4; Main=4; Meuse/Maas=4; Scheldt=4; Garonne=4; Dordogne=4; Douro=4; Guadalquivir=4; Sava=4;
Drava=4; Tisza=4; Vltava/Moldau=4; Inn=4; Weser=4; Spree=4; Neckar=4; Ruhr=4; Dee=4; Tay=4; Spey=4; Tweed=4; Wye=4; Ouse=4; Liffey=4; Amu Darya=4; Syr Darya=4; Salween=4; Chao Phraya=4;
Pearl River=4; Han=4; Yalu=4; Godavari=4; Krishna=4; Narmada=4; Kaveri/Cauvery=4; Yamuna=4; Sutlej=4; Irtysh=4; Waikato=4; Swan=4; Yarra=4; Brisbane=4; Fraser=4; Ottawa=4; Niagara=4; Connecticut=4;
Susquehanna=4; Savannah=4; Chattahoochee=4; Suwannee=4; Sacramento=4; San Joaquin=4; Platte=4; Brazos=4; Pecos=4; Gila=4; Green=4; Yellowstone=4; Allegheny=4; Monongahela=4; Cumberland=4;
Shenandoah=4; James=4; Charles=4; Magdalena=4; Madeira=4; Rio Negro/Negro=4; Xingu=4; Tocantins=4; Sao Francisco=4; Uruguay=4; Paraguay=4; Rio de la Plata/River Plate=4; Volta=4; Senegal=4; Gambia=4;
Vaal=4; East River=4; Chicago River=4; Cam=4; Medway=4; Tamar=4; Wear=4; Tees=4; Humber=4; Forth=4; Saone=4; Marne=4; Somme=4; Adige=4; Prut=4; Mosel=4; Hooghly/Hugli=4; Pasig=4; St Johns=4;
Mohawk=4; Illinois=4; Wisconsin=4; Trinity=4; Willamette=4; Salmon=4; Iguazu/Iguacu=4; Omo=4; Mara=4; Moskva=4;
Isar=5; Ems=5; Aare=5; Lagan=5; Orontes=5; Kura=5; Araks=5; Helmand=5; Red River (Vietnam)=5; Sumida=5; Shinano=5; Chenab=5; Jhelum=5; Ravi=5; Beas=5; Kolyma=5; Pechora=5; Kama=5; Oka=5; Sepik=5;
Fly=5; Whanganui=5; Clutha=5; Murrumbidgee=5; Peace=5; Athabasca=5; Saskatchewan=5; Nelson=5; Churchill=5; Wabash=5; Rappahannock=5; Merrimack=5; Kennebec=5; Penobscot=5; Usumacinta=5; Purus=5;
Pilcomayo=5; Tapajos=5; Essequibo=5; Marañon=5; Ucayali=5; Kasai=5; Ubangi=5; Benue=5; Atbara=5; Shebelle=5; Juba=5; Tana=5; Rufiji=5; Ruvuma=5; Shire=5; Kwanza/Cuanza=5; Kunene=5;
Los Angeles River=5; Exe=5; Ribble=5; Aire=5; Dart=5; Itchen=5; Test=5; Lea/Lee=5; Fleet=5; Cherwell=5; Kennet=5; Nene=5; Great Ouse=5; Derwent=5; Towy/Tywi=5; Taff=5; Usk=5; Boyne=5; Foyle=5;
Bann=5; Ness=5; Oise=5; Lot=5; Tarn=5; Piave=5; Isonzo/Soca=5; Guadiana=5; Minho/Mino=5; Jucar=5; Segura=5; Mures=5; Olt=5; Bug=5; Narva=5; Daugava/Western Dvina=5; Neman/Nemunas=5; Northern Dvina=5;
Glomma=5; Tornio=5; Dalalven=5; Lahn=5; Saar=5; Havel=5; Karun=5; Mahanadi=5; Xi Jiang/Xi=5; Huai=5; Songhua=5; Liao=5; Tumen=5; Taedong=5; Tone=5; Kamo=5; Mahaweli=5; Kapuas=5; Mahakam=5;
Chindwin=5; Litani=5; Yarmouk=5; Tarim=5; Meghna=5; Gandaki=5; Kosi=5; Ghaghara=5; Gomti=5; Tapti=5; Sabarmati=5; Hindon=5; Genesee=5; Schuylkill=5; Anacostia=5; Kanawha=5; Minnesota=5; Des Moines=5;
Kansas=5; Canadian=5; Sabine=5; Salt=5; Verde=5; Little Colorado=5; Klamath=5; Rogue=5; Clearwater=5; Bow=5; Assiniboine=5; Rideau=5; Saguenay=5; Richelieu=5; Miami=5; Hackensack=5; Passaic=5;
Pee Dee=5; Neuse=5; Altamaha=5; Apalachicola=5; St Marys=5; Alabama=5; Tombigbee=5; Yazoo=5; Atchafalaya=5; White=5; Big Sioux=5; Bighorn=5; Powder=5; Kootenai=5; Russian=5; American=5; Truckee=5;
Owens=5; Grijalva=5; Lempa=5; Chagres=5; Cauca=5; Atrato=5; Beni=5; Mamore=5; Napo=5; Japura=5; Jurua=5; Araguaia=5; Salado=5; Biobio=5; Rimac=5; Urubamba=5; Apurimac=5; Kafue=5; Luangwa=5; Cross=5;
Ogooue=5; Sanaga=5; Tugela=5; Great Fish=5; Save=5; Awash=5; Sobat=5; Lualaba=5; Chobe=5; Kagera=5; Bandama=5; Sassandra=5; Moulouya=5; Medjerda=5; Hawkesbury=5; Snowy=5; Torrens=5; Fitzroy=5;
Burdekin=5; Ord=5; Murchison=5; Gascoyne=5; Todd=5; Parramatta=5; Margaret=5; Daintree=5; Shoalhaven=5; Angara=5; Selenga=5; Kuban=5; Terek=5; Belaya=5; Vyatka=5; Indigirka=5; Aldan=5; Vilyuy=5;
Khatanga=5; Taz=5; Tobol=5; Ishim=5; Zeravshan=5; Chu=5; Ili=5` },

{ id: 'island', cat: 'Geography', q: 'Name an island', a: `
Hawaii=1; Greenland=1; Madagascar=1; Iceland=1; Ireland/Eire=1; Great Britain/Britain/Mainland Britain=1; Jamaica=1; Cuba=1; Bali=1;
Sicily=2; Sardinia=2; Corsica=2; Crete=2; Cyprus=2; Malta=2; Tasmania=2; Borneo=2; Sumatra=2; Java=2; New Guinea=2; Sri Lanka=2; Taiwan=2; Hokkaido=2; Honshu=2; Puerto Rico=2; Barbados=2; Bermuda=2;
Maui=2; Oahu=2; Fiji=2; Tahiti=2; Bora Bora=2; Easter Island/Rapa Nui=2; Galapagos=2; Long Island=2; Manhattan=2; Mallorca/Majorca=2; Ibiza=2; Santorini=2; Mykonos=2; Capri=2; Phuket=2; Tenerife=2;
New Zealand=2;
Maldives=3; Singapore=3; Hong Kong=3; Zanzibar=3; Mauritius=3; Seychelles=3; Gran Canaria=3; Lanzarote=3; Isle of Man=3; Isle of Wight=3; Anglesey=3; Skye/Isle of Skye=3; Jersey=3; Guernsey=3;
Orkney=3; Shetland=3; Newfoundland=3; Vancouver Island=3; Baffin Island=3; Prince Edward Island=3; Martha's Vineyard=3; Nantucket=3; Key West=3; Alcatraz=3; Ellis Island=3; Staten Island=3; Kauai=3;
Big Island=3; Aruba=3; Curacao=3; Trinidad=3; Tobago=3; St Lucia=3; Antigua=3; Grenada=3; Hispaniola=3; Cozumel=3; Tierra del Fuego=3; Falklands=3; Faroe Islands/Faroes=3; Elba=3; Rhodes=3; Corfu=3;
Kos=3; Lesbos=3; Zakynthos/Zante=3; Menorca/Minorca=3; Madeira=3; Azores=3; Canary Islands=3; South Island=3; North Island=3; Okinawa=3; Kyushu=3; Japan=3; Philippines=3; Bahamas=3; Grand Cayman=3;
Fuerteventura=3; Florida Keys=3; Coney Island=3; Saint Martin/St Martin/Sint Maarten=3; Samoa=3;
Iona=4; Lewis/Isle of Lewis=4; Harris=4; Arran=4; Islay=4; Mull=4; Lundy=4; Cape Breton=4; Ellesmere Island=4; Victoria Island=4; Kodiak=4; Rhode Island=4; Molokai=4; Lanai=4; Martinique=4;
Guadeloupe=4; Roatan=4; Chiloe=4; South Georgia=4; Svalbard=4; Spitsbergen=4; Gotland=4; Bornholm=4; Zealand/Sjaelland=4; Sylt=4; Texel=4; Ischia=4; Lampedusa=4; Stromboli=4; Kefalonia=4; Naxos=4;
Paros=4; Delos=4; Hydra=4; Aegina=4; Chios=4; Samos=4; Ithaca=4; Gozo=4; Formentera=4; Kangaroo Island=4; Fraser Island/K'gari=4; Rottnest=4; Stewart Island=4; Lombok=4; Sulawesi/Celebes=4; Komodo=4;
Flores=4; Timor=4; Mindanao=4; Luzon=4; Cebu=4; Palawan=4; Boracay=4; Langkawi=4; Penang=4; Koh Samui=4; Koh Phi Phi/Phi Phi=4; Shikoku=4; Jeju=4; Hainan=4; Sakhalin=4; Andaman=4; Socotra=4;
Bahrain=4; Reunion=4; Comoros=4; St Helena/Saint Helena=4; Christmas Island=4; Nauru=4; Guam=4; Saipan=4; Midway=4; Iwo Jima=4; Robben Island=4; Australia=4; Liberty Island=4; Rikers Island=4;
Fire Island=4; Block Island=4; Mackinac Island/Mackinac=4; Isle Royale=4; Padre Island/South Padre Island=4; Sanibel=4; Hilton Head=4; Santa Catalina/Catalina=4; Key Largo=4;
Aleutian Islands/Aleutians=4; Thousand Islands=4; Manitoulin Island=4; Hebrides=4; Outer Hebrides=4; Isles of Scilly/Scilly=4; Channel Islands=4; Aran Islands=4; Achill=4; Lindisfarne/Holy Island=4;
St Michael's Mount/Saint Michael's Mount=4; St Kilda=4; Skellig Michael/Skellig=4; Sark=4; Alderney=4; Grand Bahama=4; Saint Barthelemy/St Barts/St Barths=4; Anguilla=4; Montserrat=4; Nevis=4;
St Kitts/Saint Kitts=4; St Vincent/Saint Vincent=4; Dominica=4; Bonaire=4; St Thomas/Saint Thomas=4; St Croix/Saint Croix=4; Tortola=4; Turks and Caicos=4; Isla Margarita/Margarita=4; Isla Mujeres=4;
Djerba=4; Lefkada=4; Skiathos=4; Patmos=4; Milos=4; Hvar=4; Murano=4; La Palma=4; Lofoten=4; Palau=4; Bikini Atoll/Bikini=4; Tonga=4; Rarotonga=4; Moorea=4; New Caledonia=4; Vanuatu=4; Guadalcanal=4;
Whitsunday Island/Whitsundays=4; Hamilton Island=4; Phillip Island=4; Waiheke=4; Lantau=4; Miyajima=4; Leyte=4; Sentosa=4; Gili Islands/Gili Trawangan=4; Koh Tao=4; Koh Phangan=4; Phu Quoc=4;
Hong Kong Island=4; Palm Jumeirah=4; Aland/Aland Islands=4; Mont Saint-Michel/Mont St Michel=4; Ile de la Cite=4;
Oland=5; Funen=5; Rugen=5; Sao Miguel=5; Lord Howe Island=5; Norfolk Island=5; Sumba=5; Kamchatka=5; Wrangel Island=5; Novaya Zemlya=5; Pemba=5; Mayotte=5; Bioko/Fernando Po=5; Sao Tome=5;
Ascension=5; Tristan da Cunha=5; Bouvet=5; Kerguelen=5; Heard Island=5; Macquarie Island=5; Pitcairn=5; Tristan=5; Cocos=5; Wake Island=5; Diego Garcia=5; Lamu=5; Mafia Island=5; Roosevelt Island=5;
Governors Island=5; Amelia Island=5; Hatteras Island=5; Assateague=5; Chincoteague=5; Jekyll Island=5; St Simons Island=5; Tybee Island=5; Marco Island=5; Angel Island=5; Treasure Island=5;
Bainbridge Island=5; Whidbey Island=5; Orcas Island=5; Niihau=5; Kahoolawe=5; Anticosti=5; Devon Island=5; Banks Island=5; Southampton Island=5; Grand Manan=5; Inner Hebrides=5; Bute=5; Jura=5;
Rum=5; Eigg=5; Bardsey=5; Brownsea=5; Hayling Island=5; Canvey Island=5; Isle of Sheppey/Sheppey=5; Portsea Island=5; Valentia=5; Rathlin=5; Great Blasket=5; Staffa=5; Tiree=5; Coll=5; Barra=5;
Uist=5; Holy Isle=5; Herm=5; St John=5; Virgin Gorda=5; Providenciales=5; Holbox=5; Vieques=5; Andros=5; Eleuthera=5; Exuma=5; Abaco=5; Mustique=5; Bequia=5; Grand Turk=5; Cayman Brac=5;
Little Cayman=5; Isle of Youth/Isla de la Juventud=5; Procida=5; Lipari=5; Vulcano=5; Pantelleria=5; Comino=5; Euboea/Evia=5; Skopelos=5; Spetses=5; Thassos=5; Lemnos=5; Karpathos=5; Ios=5; Syros=5;
Tinos=5; Brac=5; Korcula=5; Krk=5; Mljet=5; Burano=5; Lido=5; Giglio=5; Favignana=5; Salina=5; Sifnos=5; Folegandros=5; Kythira=5; Fernando de Noronha=5; Porto Santo=5; La Gomera=5; El Hierro=5;
Sal=5; Boa Vista=5; Jan Mayen=5; Heimaey=5; Surtsey=5; Tinian=5; Yap=5; Pohnpei=5; Chuuk=5; Kwajalein=5; Tarawa=5; Kiritimati=5; Tongatapu=5; Upolu=5; Savaii=5; Aitutaki=5; Raiatea=5; Marquesas=5;
Nuku Hiva=5; Espiritu Santo=5; Bougainville=5; New Britain=5; New Ireland=5; Magnetic Island=5; Bruny Island=5; Moreton Island=5; North Stradbroke Island/Straddie=5; Melville Island=5;
Great Barrier Island=5; Chatham Islands=5; Rangitoto=5; Kapiti=5; Tiwi Islands=5; Heron Island=5; Lizard Island=5; Green Island=5; Daydream Island=5; Hayman Island=5; Maria Island=5; King Island=5;
Flinders Island=5; Nicobar=5; Lakshadweep=5; Elephanta=5; Majuli=5; Kinmen=5; Tsushima=5; Sado=5; Awaji=5; Yakushima=5; Ishigaki=5; Naoshima=5; Kuril Islands/Kurils=5; Spratly Islands/Spratlys=5;
Paracel Islands=5; Bohol=5; Siargao=5; Samar=5; Negros=5; Panay=5; Mindoro=5; Corregidor=5; Tioman=5; Batam=5; Bintan=5; Nusa Penida=5; Halmahera=5; Ambon=5; Seram=5; Koh Lanta=5; Koh Chang=5;
Con Dao=5; Cat Ba=5; Rodrigues=5; Mahe=5; Praslin=5; La Digue=5; Kish=5; Qeshm=5; Hormuz=5; Goree=5; Bijagos=5; Saaremaa=5; Hiiumaa=5; Mon/Moen=5; Usedom=5; Fehmarn=5; Heligoland/Helgoland=5;
Frisian Islands=5; Belle-Ile=5; Ile de Re=5; Ile d'Oleron=5; Ile Saint-Louis=5; Solovetsky Islands=5; Franz Josef Land=5; Severnaya Zemlya=5; Isola Bella=5; Deception Island=5; Ross Island=5;
King George Island=5; Alexander Island=5; Berkner Island=5; South Shetland Islands=5; South Orkney Islands=5` },

{ id: 'us-city', cat: 'Geography', q: 'Name a city in the USA', a: `
New York/New York City/NYC=1; Los Angeles/LA=1; Chicago=1; Miami=1; Las Vegas/Vegas=1; San Francisco=1; Boston=1; Houston=1; Seattle=1;
Dallas=2; Atlanta=2; Philadelphia/Philly=2; Washington/Washington DC=2; Denver=2; Phoenix=2; San Diego=2; Detroit=2; Orlando=2; New Orleans=2; Austin=2; Nashville=2; Portland=2; Baltimore=2;
Pittsburgh=2; Cleveland=2; Minneapolis=2; St Louis/Saint Louis=2; Salt Lake City=2; Honolulu=2; San Antonio=2; Memphis=2;
Charlotte=3; Kansas City=3; Indianapolis=3; Milwaukee=3; Cincinnati=3; Columbus=3; Sacramento=3; Tampa=3; Jacksonville=3; Buffalo=3; Albuquerque=3; Tucson=3; Anchorage=3; Oakland=3; San Jose=3;
Fort Worth=3; El Paso=3; Oklahoma City=3; Tulsa=3; Omaha=3; Louisville=3; Raleigh=3; Richmond=3; Hartford=3; Providence=3; Newark=3; Albany=3; Savannah=3; Charleston=3; Birmingham=3; Little Rock=3;
Boise=3; Spokane=3; Reno=3; Santa Fe=3; Santa Barbara=3; Palm Springs=3; Key West=3; Fort Lauderdale=3; Atlantic City=3; Hollywood=3; Beverly Hills=3; Malibu=3; Brooklyn=3; Fresno=3; Long Beach=3;
Mesa=3; Virginia Beach=3; Colorado Springs=3; Madison=3; Des Moines=3; Boulder=3; Aspen=3; Ann Arbor=3; Berkeley=3; Pasadena=3; Scottsdale=3; Sedona=3; Tallahassee=3; Montgomery=3; Jackson=3;
Baton Rouge=3; Lexington=3; Knoxville=3; Chattanooga=3; Asheville=3; Durham=3; Saint Paul/St Paul=3; Miami Beach=3; Manhattan=3;
Greensboro=4; Norfolk=4; Wilmington=4; Annapolis=4; Burlington=4; Portland Maine=4; Augusta=4; Concord=4; Montpelier=4; Cheyenne=4; Bismarck=4; Fargo=4; Pierre=4; Sioux Falls=4; Lincoln=4; Topeka=4;
Wichita=4; Springfield=4; Peoria=4; Gary=4; Fort Wayne=4; Toledo=4; Akron=4; Dayton=4; Grand Rapids=4; Flint=4; Lansing=4; Green Bay=4; Duluth=4; Rochester=4; Syracuse=4; Ithaca=4; Scranton=4;
Allentown=4; Harrisburg=4; Erie=4; Trenton=4; Camden=4; Hoboken=4; Jersey City=4; Yonkers=4; New Haven=4; Stamford=4; Bridgeport=4; Worcester=4; Cambridge=4; Salem=4; Plymouth=4; Juneau=4;
Fairbanks=4; Hilo=4; Eugene=4; Bend=4; Tacoma=4; Olympia=4; Modesto=4; Bakersfield=4; Stockton=4; Riverside=4; San Bernardino=4; Anaheim=4; Irvine=4; Santa Monica=4; Santa Cruz=4; Monterey=4; Napa=4;
Flagstaff=4; Tempe=4; Las Cruces=4; Roswell=4; Amarillo=4; Lubbock=4; Corpus Christi=4; Laredo=4; Galveston=4; Waco=4; Plano=4; Arlington=4; Shreveport=4; Lafayette=4; Biloxi=4; Mobile=4;
Pensacola=4; Gainesville=4; Daytona Beach=4; St Petersburg=4; Sarasota=4; Naples=4; Fort Myers=4; Boca Raton=4; West Palm Beach=4; Palm Beach=4; Columbia=4; Greenville=4; Myrtle Beach=4;
Charlottesville=4; Lancaster=4; Gettysburg=4; Dover=4; Jackson Hole=4; Park City=4; Vail=4; Queens=4; Bronx=4; Fort Collins=4; Provo=4; Carson City=4; Billings=4; Missoula=4; Bozeman=4; Helena=4;
Rapid City=4; Cedar Rapids=4; Kalamazoo=4; South Bend=4; Frankfort=4; Gatlinburg=4; Huntsville=4; Tuscaloosa=4; Burbank=4; Inglewood=4; Compton=4; Palo Alto=4; Mountain View=4; Cupertino=4;
Santa Clara=4; Huntington Beach=4; Newport Beach=4; Laguna Beach=4; Santa Ana=4; Bellevue=4; Princeton=4; Niagara Falls=4; Newport=4; Manchester=4; Hershey=4; Alexandria=4; Williamsburg=4;
Winston-Salem=4; Chapel Hill=4; Clearwater=4; St Augustine/Saint Augustine=4; Staten Island=4;
Rockford=5; Lowell=5; Springfield Massachusetts=5; Bangor=5; Bellingham=5; Yakima=5; Sonoma=5; Eureka=5; Redding=5; Chico=5; Yuma=5; Taos=5; Midland=5; Odessa=5; Brownsville=5; McAllen=5; Irving=5;
Macon=5; Athens Georgia=5; Roanoke=5; Lynchburg=5; Morgantown=5; Wheeling=5; Bethlehem=5; Cape Canaveral=5; Kitty Hawk=5; Tombstone=5; Deadwood=5; Dodge City=5; Branson=5; Cooperstown=5; Sturgis=5;
Telluride=5; Moab=5; Henderson=5; Chandler=5; Gilbert=5; Glendale=5; Aurora=5; Pueblo=5; Durango=5; Grand Junction=5; Ogden=5; St George/Saint George=5; Laramie=5; Casper=5; Great Falls=5;
Coeur d'Alene=5; Idaho Falls=5; Pocatello=5; Grand Forks=5; Minot=5; Sioux City=5; Davenport=5; Iowa City=5; Dubuque=5; Ames=5; Overland Park=5; Lawrence=5; Joplin=5; Independence=5; St Joseph=5;
Champaign=5; Evanston=5; Naperville=5; Joliet=5; Bloomington=5; Traverse City=5; Dearborn=5; Saginaw=5; Evansville=5; Youngstown=5; Canton=5; Bowling Green=5; Murfreesboro=5; Clarksville=5;
Pigeon Forge=5; Auburn=5; Hattiesburg=5; Tupelo=5; Oxford=5; Gulfport=5; Lake Charles=5; Monroe=5; Fayetteville=5; Hot Springs=5; Norman=5; Beaumont=5; Abilene=5; Frisco=5; College Station=5;
Killeen=5; Round Rock=5; Denton=5; Prescott=5; Torrance=5; Pomona=5; Sunnyvale=5; Fremont=5; San Luis Obispo=5; Carmel/Carmel-by-the-Sea=5; Davis=5; Chula Vista=5; Costa Mesa=5; Barstow=5; Ventura=5;
Santa Rosa=5; Escondido=5; Oceanside=5; Palm Desert=5; Palmdale=5; Vallejo=5; Hayward=5; Salinas=5; Visalia=5; Vancouver=5; Everett=5; Redmond=5; Walla Walla=5; Medford=5; Astoria=5; Ashland=5;
Lahaina=5; Kailua=5; Kona=5; Nome=5; Ketchikan=5; Sitka=5; Elizabeth=5; Paterson=5; Cape May=5; Asbury Park=5; Poughkeepsie=5; Utica=5; Binghamton=5; Schenectady=5; Saratoga Springs=5;
White Plains=5; Lake Placid=5; Woodstock=5; Quincy=5; New Bedford=5; Fall River=5; Gloucester=5; Provincetown=5; Amherst=5; Greenwich=5; New London=5; Mystic=5; Warwick=5; Nashua=5; Portsmouth=5;
Bar Harbor=5; Kennebunkport=5; State College=5; Reading=5; Wilkes-Barre=5; Ocean City=5; Frederick=5; Bethesda=5; Silver Spring=5; Jamestown=5; Newport News=5; Chesapeake=5; Hilton Head=5; Hialeah=5;
Kissimmee=5; Melbourne=5; Panama City=5; Destin=5; Ocala=5; Key Largo=5; Cape Coral=5; Port St Lucie=5; Lakeland=5; Fort Pierce=5; Ocean Springs=5; Muncie=5; Terre Haute=5; St Cloud=5; Eau Claire=5;
Oshkosh=5; La Crosse=5; Kenosha=5; Racine=5; Appleton=5; Marquette=5` },

{ id: 'desert', cat: 'Geography', q: 'Name a desert', a: `
Sahara/Sahara Desert=1; Gobi/Gobi Desert=1;
Mojave/Mojave Desert=2; Antarctic/Antarctica=2; Arabian/Arabian Desert=2; Kalahari/Kalahari Desert=2; Atacama/Atacama Desert=2; Sonoran/Sonoran Desert=2; Death Valley=2;
Arctic=3; Namib/Namib Desert=3; Great Victoria/Great Victoria Desert=3; Thar/Great Indian Desert=3; Chihuahuan/Chihuahuan Desert=3; Great Basin/Great Basin Desert=3; Simpson/Simpson Desert=3;
Great Sandy/Great Sandy Desert=3; Taklamakan/Taklamakan Desert/Taklimakan=3; Negev/Negev Desert=3; Sinai/Sinai Desert=3; Syrian/Syrian Desert=3; Rub' al Khali/Empty Quarter=3;
Patagonian/Patagonian Desert=3; Painted Desert=3;
Colorado Desert=4; Black Rock=4; White Sands=4; Gibson=4; Tanami=4; Karakum/Karakum Desert=4; Kyzylkum/Kyzylkum Desert=4; Dasht-e Kavir/Kavir=4; Dasht-e Lut/Lut=4; Libyan/Libyan Desert=4;
Nubian/Nubian Desert=4; Western Desert=4; Eastern Desert=4; Danakil=4; Karoo=4; Judean/Judean Desert=4; Wadi Rum=4; Nefud/An Nafud=4; Polar desert=4; Tenere=4; Erg Chebbi=4; White Desert=4;
Strzelecki=5; Sturt Stony=5; Little Sandy=5; Pinnacles=5; Ogaden=5; Chalbi/Chalbi Desert=5; Ordos=5; Alashan/Badain Jaran=5; Tengger=5; Kumtag=5; Thal=5; Cholistan=5; Registan=5; Dasht-e Margo=5;
Dahna=5; Tabernas=5; Bardenas Reales=5; Accona=5; Monte=5; La Guajira=5; Sechura=5; Tatacoa=5; Lencois Maranhenses=5; Jalapao=5; Red Desert=5; Owyhee=5; Alvord=5; Amargosa=5; Yuha=5; Vizcaino=5;
Altar=5; Bisti=5; Great Salt Lake Desert=5; Tule=5; Carcross=5; Tanezrouft=5; Grand Erg Oriental=5; Grand Erg Occidental=5; Escalante=5; Yuma Desert=5; Lechuguilla=5; Arava/Arabah=5; Bayuda=5;
Gurbantunggut=5; Mu Us=5; Kubuqi/Hobq=5; Lop Desert=5; Katpana/Cold Desert=5; Kaokoveld=5; Pedirka=5; Tirari=5; Wahiba Sands/Sharqiya Sands=5; Maranjab=5; Moyunkum=5; Betpak-Dala=5; Black Desert=5;
Great Sand Sea=5; Oleshky Sands=5; Bledow Desert=5; Deliblato Sands=5; Jornada del Muerto=5; Kau Desert=5; Ustyurt=5; Barsuki=5` },

{ id: 'mountain', cat: 'Geography', q: 'Name a mountain or mountain range', a: `
Everest/Mount Everest=1; Alps=1; Himalayas/Himalaya=1; Rocky Mountains/Rockies=1; Kilimanjaro/Mount Kilimanjaro=1; Andes=1; Mount Fuji/Fuji=1;
Appalachians/Appalachian Mountains/Appalachia=2; K2=2; Matterhorn/Cervino/Monte Cervino=2; Mont Blanc=2; Mount Rushmore=2; Ben Nevis=2; Snowdon/Yr Wyddfa=2; Pyrenees/Pyrenees Mountains=2;
Urals/Ural Mountains=2; Mount St Helens/Mount Saint Helens/St Helens=2; Vesuvius/Mount Vesuvius=2; Etna/Mount Etna=2; Denali/Mount McKinley=2; Mount Rainier=2; Sierra Nevada=2;
Olympus/Mount Olympus=2;
Mount Sinai/Sinai/Jebel Musa=3; Table Mountain=3; Kosciuszko/Kosciusko/Mount Kosciuszko=3; Aconcagua/Mount Aconcagua=3; Elbrus/Mount Elbrus=3; Kangchenjunga=3; Annapurna=3; Eiger=3; Jungfrau=3;
Zugspitze=3; Dolomites/Dolomiti=3; Apennines=3; Carpathians/Carpathian Mountains=3; Caucasus/Caucasus Mountains=3; Atlas Mountains/Atlas=3; Hindu Kush=3; Karakoram=3; Blue Ridge=3;
Smoky Mountains/Great Smoky Mountains/Smokies=3; Cascades/Cascade Range=3; Mount Hood=3; Mount Whitney=3; Pikes Peak=3; Grand Teton/Tetons=3; Half Dome=3; El Capitan=3; Mount Washington=3;
Adirondacks=3; Catskills=3; Ozarks=3; Black Hills=3; Mauna Kea=3; Mauna Loa=3; Kilauea=3; Mount Kenya=3; Ararat/Mount Ararat=3; Mount Cook/Aoraki/Aoraki Mount Cook=3; Uluru/Ayers Rock=3;
Blue Mountains=3; Scafell Pike=3; Pennines=3; Cairngorms=3; Brecon Beacons=3; Sierra Madre=3; Mount Shasta=3; Krakatoa=3; Teide/Mount Teide=3; Sugarloaf Mountain/Sugarloaf/Pao de Acucar=3;
Lhotse=4; Makalu=4; Cho Oyu=4; Dhaulagiri=4; Manaslu=4; Nanga Parbat=4; Pamirs=4; Tian Shan=4; Altai=4; Popocatepetl=4; Cotopaxi=4; Chimborazo=4; Fitz Roy=4; Torres del Paine=4; Ruwenzori/Rwenzori=4;
Drakensberg=4; Toubkal=4; Damavand/Mount Damavand=4; Zagros=4; Ruapehu=4; Taranaki=4; Great Dividing Range=4; Snowy Mountains=4; Helvellyn=4; Lake District=4; Grampians=4; Vosges=4; Jura=4;
Massif Central=4; Black Forest=4; Harz=4; Tatras=4; Balkan Mountains=4; Grossglockner=4; Monte Rosa=4; Brooks Range=4; Alaska Range=4; Mount Logan=4; Coast Mountains=4; Laurentians=4; Mount Baker=4;
Longs Peak=4; Maroon Bells=4; Mount Elbert=4; Wasatch=4; Sangre de Cristo=4; White Mountains=4; Green Mountains=4; Berkshires=4; Poconos=4; Allegheny=4; Mount Kinabalu=4; Puncak Jaya/Carstensz=4;
Mayon/Mount Mayon=4; Pinatubo/Mount Pinatubo=4; Merapi/Mount Merapi=4; Bromo/Mount Bromo=4; Rinjani/Mount Rinjani=4; Agung/Mount Agung=4; Tambora/Mount Tambora=4; Mount Erebus=4;
Vinson Massif/Mount Vinson=4; Mount Tai/Taishan=4; Huangshan/Yellow Mountain=4; Hua Shan=4; Kunlun=4; Mount Kailash=4; Ghats/Western Ghats=4; Hermon/Mount Hermon=4; Mount Carmel=4; Mount of Olives=4;
Taurus=4; Elburz/Alborz=4; Mont Ventoux/Ventoux=4; Mount Athos/Athos=4; Parnassus/Mount Parnassus=4; Mount Zion=4; Hekla=4; Eyjafjallajokull=4; Mourne Mountains/Mournes=4; Wicklow Mountains=4;
Ben Lomond=4; Cheviots/Cheviot Hills=4; Cadair Idris/Cader Idris=4; Pen y Fan=4; Picos de Europa=4; Montserrat=4; Ardennes=4; Bavarian Alps=4; Pilatus=4; Titlis=4; Aiguille du Midi=4; Stromboli=4;
Ama Dablam=4; Paektu/Baekdu/Changbai=4; Japanese Alps=4; Mount Aso/Aso=4; Sakurajima=4; Nyiragongo=4; Corcovado=4; Roraima/Mount Roraima=4; Pico de Orizaba/Orizaba/Citlaltepetl=4;
Rainbow Mountain/Vinicunca=4; Stone Mountain=4; Lassen Peak/Mount Lassen=4; Superstition Mountains=4; Mount Royal=4; Cradle Mountain=4; Flinders Ranges=4; Kata Tjuta/Olgas=4; Southern Alps=4;
Tongariro/Mount Tongariro=4; Ngauruhoe/Mount Ngauruhoe=4;
Gasherbrum=5; Broad Peak=5; Shishapangma=5; Huascaran=5; Ojos del Salado=5; Simien=5; Mount Cameroon=5; Carrauntoohil=5; Croagh Patrick=5; Slieve Donard=5; Rila=5; Musala=5; Triglav=5;
Gran Paradiso=5; Dent Blanche=5; Weisshorn=5; Piz Bernina=5; Saint Elias=5; Mount Adams=5; Mount Olympus Washington=5; Uinta=5; Bighorn=5; Wind River=5; Beartooth=5; San Juan=5; Sandia=5;
Cumberland=5; Ouachita=5; Guadalupe Peak=5; Chisos=5; Kita=5; Hotaka=5; Tateyama=5; Mount Apo=5; Transantarctic=5; Emei=5; Wutai=5; Qinling=5; Nanda Devi=5; Aravalli=5; Vindhya=5; Satpura=5;
Mount Abu=5; Lebanon Mountains/Mount Lebanon=5; Mount Nemrut=5; Pontic=5; Kopet Dag=5; Mount Ida=5; Mount Tabor=5; Mount Nebo=5; Kirkjufell=5; Galdhopiggen=5; Kebnekaise=5; Snaefell=5;
MacGillycuddy's Reeks=5; Ben Macdui=5; Mendips/Mendip Hills=5; Tryfan=5; Skiddaw=5; Great Gable=5; Ingleborough=5; Pen-y-ghent=5; Whernside=5; Kinder Scout=5; Sierra Morena=5; Mulhacen=5;
Cantabrian Mountains=5; Ore Mountains/Erzgebirge=5; Sudetes=5; Giant Mountains/Krkonose=5; Rhodope=5; Pirin=5; Dinaric Alps/Dinarides=5; Julian Alps=5; Rigi=5; Schilthorn=5; Santis=5;
Grandes Jorasses=5; Ortler=5; Marmolada=5; Tre Cime di Lavaredo=5; Kazbek=5; Klyuchevskaya Sopka=5; Belukha=5; Sayan Mountains=5; Verkhoyansk Range=5; Machapuchare=5; Rakaposhi=5; Tirich Mir=5;
Muztagh Ata=5; Minya Konka/Gongga Shan=5; Namcha Barwa=5; Hallasan=5; Kumgang=5; Mount Takao/Takao=5; Unzen=5; Mount Meru=5; Mount Elgon=5; Mount Stanley=5; Karisimbi=5; Ras Dashen=5;
Mount Mulanje=5; Hoggar/Ahaggar=5; Tibesti=5; Emi Koussi=5; Lion's Head=5; Iztaccihuatl=5; Cerro Torre=5; Illimani=5; Huayna Potosi=5; Sajama=5; El Misti/Misti=5; Sierra Nevada de Santa Marta=5;
Pico Bolivar=5; Huayna Picchu=5; Mount Mitchell=5; Clingmans Dome=5; Katahdin/Mount Katahdin=5; Mount Mansfield=5; Mount Marcy=5; Grandfather Mountain=5; Three Sisters=5; Mount Tamalpais=5;
Mount Diablo=5; San Gabriel Mountains=5; Santa Monica Mountains=5; Camelback Mountain=5; San Francisco Peaks=5; Humphreys Peak=5; Wheeler Peak=5; Kings Peak=5; Borah Peak=5; Granite Peak=5;
Sawtooth Range/Sawtooths=5; Flatirons=5; Mount Evans/Mount Blue Sky=5; Chugach Mountains=5; Mount Foraker=5; Mount Robson=5; Mount Assiniboine=5; Torngat Mountains=5; Black Mountains=5;
Mount Monadnock=5; Spanish Peaks=5; Mount Jefferson=5; Mount Sneffels=5; Mount of the Holy Cross=5; Mount Wellington/kunanyi=5; Mount Buller=5; MacDonnell Ranges=5; Glass House Mountains=5;
Mount Warning/Wollumbin=5; Mount Aspiring/Tititea=5; Mount Townsend=5` },

{ id: 'lake', cat: 'Geography', q: 'Name a lake', a: `
Lake Superior/Superior=1; Lake Michigan/Michigan=1; Lake Tahoe/Tahoe=1; Loch Ness/Ness=1;
Lake Erie/Erie=2; Lake Ontario/Ontario=2; Lake Huron/Huron=2; Lake Victoria/Victoria=2; Great Salt Lake=2; Dead Sea=2; Caspian Sea/Caspian=2; Lake Titicaca/Titicaca=2; Lake Baikal/Baikal=2;
Lake Geneva/Geneva/Lac Leman=2; Lake Como/Como=2; Crater Lake=2;
Lake Placid=3; Lake Mead=3; Lake Powell=3; Lake Champlain=3; Lake Louise=3; Lake Okeechobee=3; Lake Tanganyika/Tanganyika=3; Lake Malawi/Lake Nyasa/Malawi=3; Lake Chad=3; Aral Sea/Aral=3;
Lake Garda/Garda=3; Lake Lucerne/Lucerne/Vierwaldstattersee=3; Lake Constance/Bodensee=3; Windermere=3; Loch Lomond=3; Lough Neagh=3; Lake Bled/Bled=3; Lake Balaton/Balaton=3;
Sea of Galilee/Lake Tiberias/Kinneret=3;
Lake Ladoga/Ladoga=4; Lake Onega/Onega=4; Lake Vanern/Vanern=4; Lake Vattern=4; Lake Ohrid/Ohrid=4; Lake Maggiore/Maggiore=4; Lake Annecy=4; Lake Zurich/Zurich=4; Hallstatt/Hallstatter See=4;
Konigssee=4; Lake Wakatipu=4; Lake Taupo/Taupo=4; Lake Tekapo=4; Lake Eyre/Kati Thanda=4; Lake Winnipeg=4; Great Bear Lake=4; Great Slave Lake=4; Moraine Lake=4; Lake of the Woods=4; Lake George=4;
Finger Lakes=4; Lake Winnipesaukee=4; Lake Pontchartrain=4; Lake of the Ozarks=4; Yellowstone Lake=4; Mono Lake=4; Salton Sea=4; Lake Havasu=4; Lake Nicaragua=4; Lake Atitlan=4; Lake Maracaibo=4;
Lake Turkana/Turkana/Lake Rudolf=4; Lake Albert=4; Lake Kivu=4; Lake Tana=4; Lake Volta=4; Lake Kariba=4; Lake Nasser=4; Lake Natron=4; Lake Nakuru=4; Lake Balkhash/Balkhash=4; Issyk-Kul=4;
Qinghai Lake/Koko Nor=4; West Lake=4; Lake Biwa/Biwa=4; Lake Toba/Toba=4; Tonle Sap=4; Inle Lake=4; Dal Lake=4; Pangong=4; Lake Van=4; Lake Urmia=4; Lake Vostok=4; Lake Hillier=4;
Lake Retba/Pink Lake=4; Plitvice=4; Lake Lugano/Lugano=4; Lough Corrib/Corrib=4; Lough Erne/Erne=4; Ullswater=4; Derwentwater=4; Coniston Water/Coniston=4; Grasmere=4; Rutland Water=4;
Poyang Lake/Poyang=4; Dongting Lake/Dongting=4; Lake Tai/Taihu=4; Lake Pichola/Pichola=4; Lake Wanaka/Wanaka=4; Lake Rotorua/Rotorua=4;
Lake Saimaa=5; Lake Peipus=5; Lake Prespa=5; Lake Iseo=5; Lake Orta=5; Lake Trasimeno=5; Lake Bolsena=5; Lake Neuchatel=5; Lake Thun=5; Lake Brienz=5; Chiemsee=5; Wolfgangsee=5; Lake Pukaki=5;
Lake Argyle=5; Lake Burley Griffin=5; Lake Athabasca=5; Lake Nipissing=5; Lake Simcoe=5; Lake Muskoka=5; Peyto Lake=5; Lake Itasca=5; Lake Winnebago=5; Lake Mille Lacs=5; Seneca Lake=5;
Cayuga Lake=5; Moosehead Lake=5; Lake Lanier/Lake Sidney Lanier=5; Flathead Lake=5; Lake Coeur d'Alene=5; Lake Chelan=5; Clear Lake=5; Lake Texoma=5; Lake Poopo=5; General Carrera Lake=5;
Lake Nahuel Huapi=5; Lake Edward=5; Lake Naivasha=5; Lake Mweru=5; Lake Bangweulu=5; Lake Khovsgol=5; Lake Tuz=5; Lake Sevan=5; Lake Ritsa=5; Spotted Lake=5; Lake Assal=5; Lake Malaren/Malaren=5;
Lake Inari/Inari=5; Lough Derg=5; Lough Leane=5; Loch Tay=5; Loch Awe=5; Loch Katrine=5; Loch Morar=5; Loch Lochy=5; Loch Linnhe=5; Loch Fyne=5; Loch Earn=5; Loch Rannoch=5; Loch Leven=5;
Buttermere=5; Wastwater=5; Rydal Water=5; Thirlmere=5; Haweswater=5; Crummock Water=5; Bassenthwaite Lake/Bassenthwaite=5; Bala Lake/Llyn Tegid=5; Kielder Water=5; Lake Vyrnwy=5; Llyn Padarn=5;
Lake Mjosa/Mjosa=5; Lake Starnberg/Starnberger See=5; Muritz=5; Lake Scutari/Lake Skadar=5; Lake Neusiedl/Neusiedler See=5; Lake Seliger=5; Lake Ilmen=5; Lake Khanka=5; Lake Taymyr=5; Lake Zaysan=5;
Lake Sarez=5; Karakul=5; Song Kol/Son-Kul=5; Lake Tharthar=5; Lake Qarun=5; Lake Manzala=5; Lake Kyoga=5; Lake Rukwa=5; Lake Manyara=5; Lake Bosumtwi=5; Lake Bunyonyi=5; Lake Abbe=5; Lake Assad=5;
Lake Lanao=5; Laguna de Bay=5; Taal Lake=5; Songkhla Lake=5; Hoan Kiem Lake=5; Erhai=5; Dian Lake/Dianchi=5; Namtso/Nam Co=5; Yamdrok Lake=5; Lake Manasarovar/Manasarovar=5; Uvs Lake=5;
Chilika Lake/Chilka Lake=5; Loktak Lake=5; Vembanad=5; Phewa Lake/Fewa Lake=5; Rara Lake=5; Tilicho Lake=5; Lake Saiful Muluk=5; Lake Hawea=5; Lake Manapouri=5; Lake Te Anau=5; Lake Matheson=5;
Lake Torrens=5; Lake Gairdner=5; Lake St Clair/Lake Saint Clair=5; Lake Macquarie=5; Lake McKenzie=5; Lake Eucumbene=5; Blue Lake=5; Lake Shasta/Shasta Lake=5; Big Bear Lake=5; Lake Elsinore=5;
Lake Arrowhead=5; Pyramid Lake=5; Walker Lake=5; Utah Lake=5; Bear Lake=5; Lake Pend Oreille=5; Lake Sakakawea=5; Lake Oahe=5; Lake Minnetonka=5; Lake Mendota=5; Reelfoot Lake=5; Kentucky Lake=5;
Lake Cumberland=5; Lake Norman=5; Lake Travis=5; Caddo Lake=5; Oneida Lake=5; Lake Hopatcong=5; Lake Martin=5; Lake Murray=5; Lake Manitoba=5; Lake Winnipegosis=5; Lake Nipigon=5; Reindeer Lake=5;
Emerald Lake=5; Maligne Lake=5; Lake Minnewanka=5; Okanagan Lake=5; Lac Saint-Jean/Lac St-Jean=5; Lake Memphremagog=5; Lake Mistassini=5; Garibaldi Lake=5; Lake Chapala=5; Lake Patzcuaro=5;
Lake Texcoco=5; Lake Managua=5; Gatun Lake=5; Lake Guatavita=5; Lake Llanquihue=5; Laguna Colorada=5; Lake Argentino=5; Lake Viedma=5; Lagoa dos Patos=5; Lake Yojoa=5` },

{ id: 'language', cat: 'Culture', q: 'Name a language', a: `
English=1; Spanish=1; French=1; German=1; Chinese/Mandarin=1; Japanese=1; Italian=1;
Portuguese=2; Russian=2; Arabic=2; Korean=2; Hindi=2; Dutch=2; Greek=2; Latin=2; Swedish=2; Polish=2; Hebrew=2; Turkish=2; Cantonese=2; Irish/Gaelic=2; Welsh=2; Norwegian=2; Danish=2; Finnish=2;
Vietnamese=2; Thai=2; Urdu=2; Bengali/Bangla=2;
Punjabi=3; Tamil=3; Telugu=3; Marathi=3; Gujarati=3; Kannada=3; Malayalam=3; Persian/Farsi=3; Swahili=3; Indonesian/Bahasa=3; Malay=3; Tagalog/Filipino=3; Ukrainian=3; Czech=3; Hungarian=3;
Romanian=3; Bulgarian=3; Serbian=3; Croatian=3; Icelandic=3; Scottish Gaelic=3; Catalan=3; Basque=3; Yiddish=3; Sanskrit=3; Esperanto=3; Klingon=3; Elvish/Sindarin/Quenya=3; Afrikaans=3; Zulu=3;
Xhosa=3; Hawaiian=3; Maori=3; Navajo=3; Cherokee=3; Sign language/ASL=3; Estonian=3; Latvian=3; Lithuanian=3; Slovak=3; Slovenian=3; Albanian=3; Armenian=3; Georgian=3; Mongolian=3; Tibetan=3;
Nepali=3; Pashto=3; Kurdish=3; Amharic=3; Somali=3; Yoruba=3; Igbo=3; Hausa=3; Quechua=3; Guarani=3; Aramaic=3; Old English/Anglo-Saxon=3; Ancient Greek=3;
Coptic=4; Gothic=4; Breton=4; Cornish=4; Manx=4; Frisian=4; Luxembourgish=4; Faroese=4; Sami=4; Romansh=4; Ladino=4; Occitan=4; Galician=4; Corsican=4; Sardinian=4; Sicilian=4; Maltese=4;
Macedonian=4; Bosnian=4; Belarusian=4; Kazakh=4; Uzbek=4; Kyrgyz=4; Tajik=4; Turkmen=4; Azerbaijani/Azeri=4; Tatar=4; Chechen=4; Uyghur=4; Burmese=4; Khmer=4; Lao=4; Javanese=4;
Cebuano/Bisaya/Visayan=4; Hmong=4; Sinhala=4; Odia/Oriya=4; Assamese=4; Sindhi=4; Malagasy=4; Wolof=4; Fula/Fulani=4; Twi/Akan=4; Lingala=4; Kinyarwanda=4; Luganda=4; Oromo=4; Tigrinya=4;
Berber/Tamazight=4; Shona=4; Sesotho/Sotho=4; Setswana/Tswana=4; Samoan=4; Tongan=4; Fijian=4; Tok Pisin=4; Inuktitut=4; Cree=4; Ojibwe=4; Lakota=4; Nahuatl=4; Maya/Yucatec=4; Aymara=4; Sumerian=4;
Old Norse=4; Middle English=4; Dothraki=4; Patois/Jamaican Patois/Jamaican=4; Creole/Haitian Creole=4; Pidgin=4; Ancient Egyptian/Egyptian=4; Valyrian/High Valyrian=4; British Sign Language/BSL=4;
Hindustani=4; Dari=4; Flemish=4; Swiss German=4; Scots=4; Romani/Romany=4; Bhojpuri=4; Wu/Shanghainese=4; Hokkien/Min Nan/Taiwanese=4; Hakka=4; Bambara=4; Serbo-Croatian=4;
Sundanese=5; Ilocano=5; Dhivehi=5; Dzongkha=5; Kashmiri=5; Konkani=5; Tulu=5; Santali=5; Ewe=5; Kirundi=5; Ndebele=5; Chichewa/Nyanja=5; Kikuyu=5; Tahitian=5; Bislama=5; Mohawk=5; Hopi=5;
Mapudungun=5; Greenlandic/Kalaallisut=5; Ainu=5; Etruscan=5; Akkadian=5; Hittite=5; Phoenician=5; Pali=5; Avestan=5; Tocharian=5; Volapuk=5; Lojban=5; Na'vi=5; Toki Pona=5; Interlingua=5; Bavarian=5;
Low German/Plattdeutsch=5; Ulster Scots=5; Norn=5; Old French=5; Old Church Slavonic/Church Slavonic=5; Livonian=5; Karelian=5; Udmurt=5; Komi=5; Mari=5; Erzya/Mordvin=5; Chuvash=5; Bashkir=5;
Kalmyk=5; Yakut/Sakha=5; Buryat=5; Evenki=5; Chukchi=5; Nenets=5; Ossetian=5; Abkhaz=5; Avar=5; Ingush=5; Circassian/Adyghe=5; Mingrelian=5; Laz=5; Zaza=5; Balochi=5; Brahui=5; Saraiki=5;
Rajasthani=5; Maithili=5; Awadhi=5; Dogri=5; Manipuri/Meitei=5; Mizo=5; Khasi=5; Bodo=5; Newari/Nepal Bhasa=5; Sherpa=5; Rohingya=5; Karen=5; Shan=5; Mon=5; Zhuang=5; Teochew=5; Manchu=5; Waray=5;
Hiligaynon/Ilonggo=5; Kapampangan=5; Bikol=5; Chamorro=5; Palauan=5; Marshallese=5; Tetum=5; Balinese=5; Madurese=5; Minangkabau=5; Pitjantjatjara=5; Warlpiri=5; Arrernte=5; Rarotongan=5;
Luo/Dholuo=5; Maasai/Maa=5; Afar=5; Khoekhoe/Nama=5; Tsonga/Xitsonga=5; Venda/Tshivenda=5; Swazi/siSwati=5; Kanuri=5; Tiv=5; Efik=5; Fon=5; Mandinka=5; Songhay=5; Tamasheq/Tuareg=5; Kabyle=5;
Sango=5; Kikongo/Kongo=5; Bemba=5; Krio=5; Mauritian Creole=5; Seychellois Creole=5; K'iche'/Quiche=5; Mixtec=5; Zapotec=5; Otomi=5; Garifuna=5; Miskito=5; Tupi=5; Arawak=5; Taino=5; Inupiaq=5;
Yupik=5; Aleut=5; Tlingit=5; Haida=5; Blackfoot=5; Dakota=5; Cheyenne=5; Comanche=5; Apache=5; Zuni=5; Choctaw=5; Muscogee/Creek=5; Mi'kmaq=5; Michif=5; Gullah=5; Papiamento=5; Sranan Tongo=5;
Pennsylvania Dutch=5; Cajun French=5; Louisiana Creole=5; Aromanian=5; Sorbian=5; Kashubian=5; Silesian=5; Rusyn=5; Venetian=5; Neapolitan=5; Friulian=5; Ladin=5; Asturian=5; Aragonese=5;
Valencian=5; Provencal=5; Walloon=5; Alsatian=5; Jerriais=5; Gagauz=5; Crimean Tatar=5; Moldovan=5; Montenegrin=5; Elamite=5; Ugaritic=5; Mycenaean Greek/Linear B=5; Oscan=5; Gaulish=5; Pictish=5;
Old Persian=5; Sogdian=5; Babylonian=5; Classical Chinese=5; Old Irish=5; Old High German=5; Middle High German=5; Ido=5; Solresol=5; Newspeak=5; Parseltongue=5; Black Speech=5; Simlish=5; Nadsat=5;
Huttese=5; Kryptonian=5` },

{ id: 'currency', cat: 'Geography', q: 'Name a currency', a: `
Dollar/US dollar/American dollar/Canadian dollar/Australian dollar/New Zealand dollar/Hong Kong dollar/Singapore dollar/Buck=1; Euro=1; Pound/Pound sterling/Sterling/British pound/GBP/Quid=1;
Yen/Japanese yen=1; Peso/Mexican peso/Argentine peso/Philippine peso/Chilean peso/Colombian peso/Cuban peso=1; Rupee/Indian rupee/Pakistani rupee/Sri Lankan rupee/Nepalese rupee=1;
Franc/Swiss franc/French franc/Belgian franc/CFA franc=2; Yuan/Renminbi/Chinese yuan/RMB=2; Ruble/Rouble/Russian ruble=2; Bitcoin=2;
Krona/Krone/Swedish krona/Norwegian krone/Danish krone/Icelandic krona=2; Real/Brazilian real=2; Won/Korean won/South Korean won=2; Lira/Turkish lira/Italian lira=2;
Rand/South African rand=3; Shekel/Israeli shekel/New shekel/Sheqel=3; Dinar/Kuwaiti dinar/Iraqi dinar/Jordanian dinar/Serbian dinar=3; Dirham/UAE dirham/Moroccan dirham=3;
Riyal/Rial/Saudi riyal/Qatari riyal/Iranian rial/Omani rial=3; Baht=3; Ringgit=3; Rupiah=3; Dong=3; Zloty=3; Forint=3; Koruna=3; Shilling=3; Mark/Deutsche Mark/Deutschmark/Convertible mark=3;
Drachma=3; Peseta=3; Guilder/Gulden=3; Crown=3; Ether/Ethereum=3; Dogecoin=3; Cent=3; Penny/Pence=3;
Leu/Romanian leu/Moldovan leu=4; Lev/Bulgarian lev=4; Kuna=4; Hryvnia=4; Manat=4; Tenge=4; Kip=4; Riel=4; Kyat=4; Taka=4; Afghani=4; Naira=4; Cedi=4; Birr=4; Kwacha=4; Bolivar/Bolivar soberano=4;
Sol/Peruvian sol=4; Boliviano=4; Guarani=4; Colon/Costa Rican colon=4; Cordoba=4; Lempira=4; Quetzal=4; Balboa=4; Escudo=4; Schilling=4; Ducat=4; Doubloon=4; Florin=4; Guinea=4; Sovereign=4;
Reichsmark=4; Sestertius=4; Denarius=4; Thaler/Taler=4; Piece of eight/Pieces of eight=4; Farthing=4; Halfpenny/Ha'penny=4; Sixpence=4; Kopek/Kopeck=4; Litecoin=4; Ripple/XRP=4; Solana=4; Tether=4;
Cowrie shells/Cowrie=4; Wampum=4;
Lari=5; Dram=5; Som=5; Somoni=5; Tugrik=5; Ngultrum=5; Rufiyaa=5; Kwanza=5; Pula=5; Loti=5; Lilangeni/Emalangeni=5; Metical=5; Ariary=5; Nakfa=5; Dalasi=5; Leone=5; Ouguiya=5; Gourde=5; Kina=5;
Vatu=5; Tala=5; Pa'anga=5; Denar=5; Markka=5; Punt=5; Groat=5; Pataca=5; Dobra=5; Nuevo sol=5; Talent=5; Obol=5; Aureus=5; Solidus=5; Louis d'or=5; Half crown=5; Threepence/Thruppence=5; Pfennig=5;
Centime=5; Paisa=5; Fils=5; Halala=5; Kroon=5; Litas=5; Lats=5; Tolar=5; Sucre=5; Austral=5; Cruzeiro=5; Cruzado=5; Inti=5; Zaire=5; Rentenmark=5; Ostmark=5; Karbovanets=5;
Ecu/European Currency Unit=5; Monero=5; Cardano=5; Rai stones/Rai=5; Ryo=5; Mon=5; Tael=5` },

{ id: 'italy-city', cat: 'Geography', q: 'Name a city in Italy', a: `
Rome/Roma=1; Venice/Venezia=1; Milan/Milano=1; Florence/Firenze=1; Naples/Napoli=1;
Pisa=2; Turin/Torino=2; Verona=2; Bologna=2; Genoa/Genova=2; Palermo=2;
Siena=3; Sorrento=3; Amalfi=3; Positano=3; Bari=3; Catania=3; Parma=3; Modena=3; Padua/Padova=3; Lucca=3; Assisi=3; Perugia=3; Bergamo=3; Como=3; Trieste=3; Cagliari=3; Messina=3;
Syracuse/Siracusa=3; Taormina=3; Rimini=3; Ravenna=3; Pompeii/Pompei=3;
Ferrara=4; Mantua/Mantova=4; Cremona=4; Brescia=4; Vicenza=4; Treviso=4; Trento=4; Bolzano=4; Udine=4; Aosta=4; La Spezia=4; Portofino=4; San Remo=4; Livorno=4; Arezzo=4; Cortona=4; Montepulciano=4;
San Gimignano=4; Orvieto=4; Urbino=4; Ancona=4; Pescara=4; L'Aquila=4; Matera=4; Lecce=4; Brindisi=4; Taranto=4; Salerno=4; Capri=4; Reggio Calabria=4; Agrigento=4; Trapani=4; Cefalu=4; Olbia=4;
Alghero=4; Prato=4; Caserta=4; Monza=4; Cortina d'Ampezzo/Cortina=4; Murano=4; Bellagio=4; Cinque Terre=4; Savona=4; Carrara=4; Viareggio=4; Vinci=4; Imola=4; Maranello=4; Mestre=4; Corleone=4;
Ostia=4; Tivoli=4; Civitavecchia=4; Fiumicino=4;
Cuneo=5; Asti=5; Alba=5; Spoleto=5; Herculaneum/Ercolano=5; Cosenza=5; Catanzaro=5; Marsala=5; Ragusa=5; Noto=5; Sassari=5; Piacenza=5; Reggio Emilia=5; Forli=5; Pistoia=5; Viterbo=5; Latina=5;
Frosinone=5; Benevento=5; Foggia=5; Novara=5; Varese=5; Pavia=5; Lodi=5; Rovigo=5; Belluno=5; Chioggia=5; Burano=5; Gubbio=5; Todi=5; Volterra=5; Montalcino=5; Pienza=5; Stresa=5; Sirmione=5;
Vernazza=5; Manarola=5; Riomaggiore=5; Monterosso=5; Ravello=5; Tropea=5; Polignano a Mare=5; Alberobello=5; Ostuni=5; Monopoli=5; Gallipoli=5; Otranto=5; Terni=5; Rieti=5; Teramo=5; Chieti=5;
Campobasso=5; Potenza=5; Crotone=5; Enna=5; Caltanissetta=5; Erice=5; Nuoro=5; Oristano=5; Imperia=5; Rapallo=5; Santa Margherita Ligure=5; Camogli=5; Massa=5; Forte dei Marmi=5; Grosseto=5;
Fiesole=5; Ascoli Piceno=5; Macerata=5; Loreto=5; Pesaro=5; Cesena=5; Faenza=5; Riccione=5; Bassano del Grappa=5; Jesolo=5; Aquileia=5; Gorizia=5; Pordenone=5; Merano=5; Bressanone/Brixen=5;
Rovereto=5; Riva del Garda=5; Desenzano=5; Lecco=5; Sondrio=5; Bormio=5; Livigno=5; Courmayeur=5; Cervinia/Breuil-Cervinia=5; Biella=5; Vercelli=5; Alessandria=5; Ivrea=5; Sestriere=5; Barolo=5;
Vigevano=5; Crema=5; Pozzuoli=5; Torre del Greco=5; Castellammare di Stabia=5; Paestum=5; Avellino=5; Maratea=5; Scilla=5; Modica=5; Piazza Armerina=5; Monreale=5; Milazzo=5; Gela=5; Frascati=5;
Anzio=5; Gaeta=5; Terracina=5; Cassino=5; Sulmona=5; Trani=5; Barletta=5; Andria=5; Vieste=5; Varenna=5; Menaggio=5; Lerici=5; Portovenere=5; Montecatini Terme=5` },

{ id: 'japan-city', cat: 'Geography', q: 'Name a city in Japan', a: `
Tokyo/Edo=1; Osaka=1; Kyoto=1;
Hiroshima=2; Nagasaki=2; Yokohama=2; Sapporo=2; Nagoya=2; Kobe=2; Nara=2;
Fukuoka=3; Sendai=3; Okinawa/Naha=3; Kawasaki=3; Hakone=3; Nikko=3; Kamakura=3; Kanazawa=3; Nagano=3;
Takayama=4; Matsumoto=4; Niigata=4; Shizuoka=4; Hamamatsu=4; Kumamoto=4; Kagoshima=4; Okayama=4; Himeji=4; Kitakyushu=4; Chiba=4; Saitama=4; Narita=4; Hakodate=4; Otaru=4; Aomori=4; Fukushima=4;
Miyajima/Itsukushima=4; Yokosuka=4; Toyota=4; Shibuya=4; Shinjuku=4; Akihabara=4; Harajuku=4; Ginza=4; Roppongi=4; Asakusa=4; Toyama=4; Sakai=4;
Asahikawa=5; Akita=5; Morioka=5; Yamagata=5; Mito=5; Utsunomiya=5; Maebashi=5; Kofu=5; Gifu=5; Tsu=5; Otsu=5; Wakayama=5; Tottori=5; Matsue=5; Yamaguchi=5; Tokushima=5; Takamatsu=5; Matsuyama=5;
Kochi=5; Saga=5; Oita=5; Beppu=5; Miyazaki=5; Ise=5; Karuizawa=5; Atami=5; Ito=5; Shirakawa-go=5; Kurashiki=5; Onomichi=5; Kawaguchi=5; Fujiyoshida=5; Kawagoe=5; Kurume=5; Sasebo=5; Iwakuni=5;
Hachioji=5; Ikebukuro=5; Odaiba=5; Gion=5; Fukui=5; Shimonoseki=5; Kushiro=5; Obihiro=5; Wakkanai=5; Abashiri=5; Noboribetsu=5; Furano=5; Niseko=5; Hachinohe=5; Hirosaki=5; Ishinomaki=5; Iwaki=5;
Koriyama=5; Aizuwakamatsu/Aizu=5; Tsukuba=5; Funabashi=5; Matsudo=5; Sagamihara=5; Fujisawa=5; Odawara=5; Numazu=5; Fuji=5; Shimoda=5; Gotemba=5; Toyohashi=5; Okazaki=5; Inuyama=5; Seto=5; Hikone=5;
Uji=5; Higashiosaka=5; Takarazuka=5; Nishinomiya=5; Amagasaki=5; Akashi=5; Fukuyama=5; Kure=5; Izumo=5; Hagi=5; Dazaifu=5; Arita=5; Shimabara=5; Ishigaki=5; Ueno=5; Shinagawa=5; Kitakami=5;
Hanamaki=5; Tsuruoka=5; Sakata=5; Joetsu=5; Nagaoka=5; Takaoka=5; Komatsu=5; Suzuka=5; Yokkaichi=5; Imabari=5; Uwajima=5; Yufuin=5; Kirishima=5; Minamata=5; Yokote=5; Nanao=5; Kakunodate=5; Ogaki=5;
Tsuyama=5; Kakegawa=5` },

{ id: 'canada', cat: 'Geography', q: 'Name a Canadian province, territory or city', a: `
Toronto=1; Vancouver=1; Montreal=1; Ontario=1; Quebec=1;
Ottawa=2; Calgary=2; British Columbia/BC=2; Alberta=2; Edmonton=2; Winnipeg=2; Nova Scotia=2; Halifax=2; Quebec City=2;
Manitoba=3; Saskatchewan=3; Newfoundland/Newfoundland and Labrador=3; Yukon=3; New Brunswick=3; Prince Edward Island/PEI=3; Northwest Territories=3; Nunavut=3; Victoria=3; Regina=3; Saskatoon=3;
Hamilton=3; Kingston=3; Niagara Falls=3; Banff=3; Whistler=3; Mississauga=3;
London=4; Windsor=4; Jasper=4; Kelowna=4; Kamloops=4; Nanaimo=4; Surrey=4; Burnaby=4; Richmond=4; Brampton=4; Markham=4; Oshawa=4; Barrie=4; Sudbury=4; Thunder Bay=4; Waterloo=4; Kitchener=4;
Guelph=4; Gatineau=4; Laval=4; Sherbrooke=4; Moncton=4; Fredericton=4; Saint John=4; Charlottetown=4; St John's=4; Whitehorse=4; Yellowknife=4; Iqaluit=4; Labrador=4; Lake Louise=4; Peterborough=4;
Burlington=4; Oakville=4; Vaughan=4; Mont-Tremblant=4;
Sault Ste Marie=5; St Catharines=5; Trois-Rivieres=5; Saguenay=5; Corner Brook=5; Sydney=5; Dawson City=5; Churchill=5; Red Deer=5; Lethbridge=5; Medicine Hat=5; Fort McMurray=5; Grande Prairie=5;
Moose Jaw=5; Prince Albert=5; Brandon=5; Prince George=5; Tofino=5; Penticton=5; Lunenburg=5; Peggy's Cove=5; Tadoussac=5; Abbotsford=5; Coquitlam=5; Chilliwack=5; Vernon=5; Prince Rupert=5;
Squamish=5; Revelstoke=5; Nelson=5; Cranbrook=5; Fernie=5; Canmore=5; Drumheller=5; Inuvik=5; Tuktoyaktuk=5; Rankin Inlet=5; Cambridge Bay=5; Flin Flon=5; Thompson=5; North Bay=5; Timmins=5;
Belleville=5; Cornwall=5; Orillia=5; Collingwood=5; Owen Sound=5; Sarnia=5; Brantford=5; Richmond Hill=5; Niagara-on-the-Lake=5; Stratford=5; Levis=5; Longueuil=5; Drummondville=5; Rimouski=5;
Sept-Iles=5; Gaspe=5; Chicoutimi=5; Rouyn-Noranda=5; Dartmouth=5; Truro=5; Yarmouth=5; Miramichi=5; Summerside=5; Gander=5; Happy Valley-Goose Bay/Goose Bay=5; Labrador City=5; Pickering=5; Ajax=5;
Whitby=5; St Albert=5; Airdrie=5; Okotoks=5; Camrose=5; Saint-Jerome=5; Granby=5; Joliette=5; Antigonish=5; Wolfville=5; Bathurst=5; Edmundston=5; Grand Falls-Windsor=5; Kenora=5; Huntsville=5;
Dawson Creek=5; Fort St John=5; Port Hardy=5; Quesnel=5; Williams Lake=5; Salmon Arm=5` },

{ id: 'geo-any-country', cat: 'Geography', q: 'Name a country', a: `
France=1; Germany=1; Italy=1; Spain=1; United Kingdom/UK/Britain/Great Britain/England/United Kingdom of Great Britain and Northern Ireland=1; Russia/Russian Federation=1;
China/People's Republic of China/PRC=1; Japan=1; India=1; United States/USA/US/America/United States of America=1; Canada=1; Mexico=1; Brazil=1; Australia=1;
Portugal=2; Greece=2; Ireland/Republic of Ireland/Eire=2; Netherlands/Holland=2; Belgium=2; Switzerland=2; Austria=2; Sweden=2; Norway=2; Denmark=2; Poland=2; Finland=2; Ukraine=2; Iceland=2;
Scotland=2; Turkey/Turkiye=2; Egypt=2; South Africa=2; Nigeria=2; Kenya=2; Morocco=2; Ethiopia/Abyssinia=2; Ghana/Gold Coast=2; Madagascar=2; South Korea/Korea/Republic of Korea=2; Thailand/Siam=2;
Vietnam=2; North Korea/DPRK=2; Indonesia=2; Philippines=2; Malaysia=2; Singapore=2; Pakistan=2; Afghanistan=2; Iran/Persia=2; Iraq=2; Saudi Arabia=2; Israel=2; Taiwan/Republic of China=2;
United Arab Emirates/UAE/Emirates=2; Argentina=2; Chile=2; Colombia=2; Peru=2; Venezuela=2; Cuba=2; Jamaica=2; Costa Rica=2; New Zealand/Aotearoa=2;
Czechia/Czech Republic=3; Hungary=3; Romania/Rumania=3; Croatia=3; Wales=3; Serbia=3; Bulgaria=3; Slovakia=3; Luxembourg=3; Monaco=3; Malta=3; Cyprus=3; Vatican City/Vatican/Holy See=3; Estonia=3;
Latvia=3; Lithuania=3; Albania=3; Belarus/Byelorussia=3; Georgia=3; Kazakhstan=3; Algeria=3; Libya=3; Sudan=3; Tunisia=3; Somalia=3; Uganda=3; Tanzania/Tanganyika=3; Zimbabwe/Rhodesia=3; Rwanda=3;
Democratic Republic of the Congo/DR Congo/DRC/Congo/Zaire/Congo-Kinshasa/Democratic Republic of Congo=3; Senegal=3; Cameroon=3; Mali=3; Namibia/South West Africa=3; Botswana/Bechuanaland=3; Zambia=3;
Angola=3; Mozambique=3; Ivory Coast/Cote d'Ivoire=3; Niger=3; Chad=3; Sierra Leone=3; Liberia=3; Malawi/Nyasaland=3; South Sudan=3; Gambia=3; Eritrea=3; Seychelles=3; Mauritius=3; Nepal=3;
Bangladesh=3; Sri Lanka/Ceylon=3; Mongolia=3; Cambodia/Kampuchea=3; Syria=3; Laos=3; Myanmar/Burma=3; Bhutan=3; Maldives=3; Qatar=3; Kuwait=3; Jordan=3; Lebanon=3; Yemen=3; Oman=3; Uzbekistan=3;
Palestine/State of Palestine=3; Ecuador=3; Bolivia=3; Uruguay=3; Paraguay=3; Panama=3; Haiti=3; Dominican Republic=3; Puerto Rico=3; Bahamas=3; Guatemala=3; Honduras=3; El Salvador=3; Nicaragua=3;
Belize/British Honduras=3; Guyana/British Guiana=3; Suriname/Surinam/Dutch Guiana=3; Barbados=3; Trinidad and Tobago/Trinidad=3; Fiji=3; Papua New Guinea/PNG=3; Samoa/Western Samoa=3; Tonga=3;
Vanuatu/New Hebrides=3; Solomon Islands=3;
Slovenia=4; Bosnia and Herzegovina/Bosnia/Bosnia-Herzegovina=4; Montenegro=4; North Macedonia/Macedonia=4; Moldova=4; Andorra=4; Liechtenstein=4; San Marino=4; Kosovo=4; Northern Ireland=4;
Gibraltar=4; Isle of Man=4; Armenia=4; Azerbaijan=4; Greenland=4; Burkina Faso/Upper Volta=4; Cape Verde/Cabo Verde=4; Togo=4; Benin/Dahomey=4; Gabon=4; Guinea=4; Burundi=4; Mauritania=4;
Lesotho/Basutoland=4; Eswatini/Swaziland=4; Djibouti=4; Republic of the Congo/Congo-Brazzaville/Congo Republic/Republic of Congo=4; Western Sahara=4; Hong Kong=4; Bahrain=4; Turkmenistan=4;
Kyrgyzstan/Kirghizia=4; Tajikistan=4; Brunei=4; East Timor/Timor-Leste=4; Dominica=4; Grenada=4; Saint Lucia/St Lucia=4; Antigua and Barbuda/Antigua=4;
Saint Kitts and Nevis/St Kitts and Nevis/St Kitts=4; French Guiana=4; Aruba=4; Curacao=4; Bermuda=4; Cayman Islands/Caymans=4; Guam=4; French Polynesia/Tahiti=4; New Caledonia=4; Kiribati=4;
Micronesia/Federated States of Micronesia=4; Marshall Islands=4; Palau=4; Nauru=4; Tuvalu/Ellice Islands=4; Cook Islands=4; American Samoa=4;
Faroe Islands/Faroes=5; Jersey=5; Guernsey=5; Comoros=5; Equatorial Guinea=5; Guinea-Bissau=5; Central African Republic/CAR=5; Sao Tome and Principe/Sao Tome=5; Somaliland=5; Reunion=5; Mayotte=5;
Saint Helena/St Helena=5; Macau/Macao=5; Saint Vincent and the Grenadines/St Vincent and the Grenadines/St Vincent=5; Martinique=5; Guadeloupe=5; Falkland Islands/Falklands=5;
Turks and Caicos Islands/Turks and Caicos=5; Anguilla=5; Montserrat=5; Sint Maarten=5; Bonaire=5; US Virgin Islands/Virgin Islands/United States Virgin Islands=5; British Virgin Islands/BVI=5;
Saint Martin/St Martin=5; Saint Barthelemy/St Barts/St Barths=5; Saint Pierre and Miquelon=5; Saba=5; Sint Eustatius/Statia=5; Niue=5; Northern Mariana Islands/Northern Marianas=5;
Pitcairn Islands/Pitcairn=5; Wallis and Futuna=5; Tokelau=5` },

{ id: 'geo-uk-city', cat: 'Geography', q: 'Name a town or city in the UK', a: `
London=1; Manchester=1; Birmingham=1; Liverpool=1; Edinburgh=1; Glasgow=1; Cardiff=1; Leeds=1; Bristol=1;
Newcastle/Newcastle upon Tyne=2; Sheffield=2; Belfast=2; Oxford=2; Cambridge=2; Brighton=2; Nottingham=2; Leicester=2; York=2; Bath=2; Southampton=2; Aberdeen=2; Dundee=2; Swansea=2; Plymouth=2;
Portsmouth=2; Coventry=2; Norwich=2; Inverness=2;
Bradford=3; Hull/Kingston upon Hull=3; Derby=3; Stoke/Stoke-on-Trent=3; Wolverhampton=3; Sunderland=3; Middlesbrough=3; Reading=3; Milton Keynes=3; Exeter=3; Canterbury=3; Blackpool=3; Bournemouth=3;
Preston=3; Bolton=3; Wigan=3; Stockport=3; Salford=3; Huddersfield=3; Wakefield=3; Doncaster=3; Rotherham=3; Barnsley=3; Lincoln=3; Peterborough=3; Ipswich=3; Colchester=3; Chelmsford=3; Luton=3;
Watford=3; Northampton=3; Gloucester=3; Cheltenham=3; Worcester=3; Hereford=3; Shrewsbury=3; Chester=3; Carlisle=3; Lancaster=3; Durham=3; Winchester=3; Salisbury=3; Stratford-upon-Avon/Stratford=3;
Windsor=3; Dover=3; Torquay=3; Stirling=3; Perth=3; Derry/Londonderry=3; Newport=3; Wrexham=3; Bangor=3; St Andrews/Saint Andrews=3; Swindon=3; Slough=3; Southend/Southend-on-Sea=3; Scarborough=3;
Whitby=3; Harrogate=3; Blackburn=3; Burnley=3; Oldham=3; Warrington=3; Crewe=3; Grimsby=3; Hastings=3; Eastbourne=3; Margate=3; Penzance=3; St Ives=3; Newquay=3; Falmouth=3; Truro=3; Aberystwyth=3;
Llandudno=3; Fort William=3; Oban=3; Paisley=3; Croydon=3;
Warwick=4; Eton=4; Crawley=4; Basingstoke=4; Guildford=4; Rochdale=4; Bury=4; Birkenhead=4; Southport=4; St Helens=4; Walsall=4; Dudley=4; West Bromwich=4; Telford=4; Stafford=4; Lichfield=4;
Burton upon Trent/Burton=4; Loughborough=4; Mansfield=4; Chesterfield=4; Scunthorpe=4; Halifax=4; Kendal=4; Keswick=4; Windermere=4; Ambleside=4; Barrow-in-Furness/Barrow=4; Morecambe=4; Skipton=4;
Ripon=4; Beverley=4; Bridlington=4; Hexham=4; Berwick-upon-Tweed/Berwick=4; Alnwick=4; Darlington=4; Hartlepool=4; Stockton-on-Tees/Stockton=4; Gateshead=4; South Shields=4; Solihull=4; Redditch=4;
Nuneaton=4; Rugby=4; Leamington Spa/Royal Leamington Spa/Leamington=4; Kenilworth=4; Banbury=4; Bicester=4; Kettering=4; Corby=4; Bedford=4; Stevenage=4; St Albans=4; Hemel Hempstead=4; Harlow=4;
Basildon=4; Clacton/Clacton-on-Sea=4; Harwich=4; Bury St Edmunds=4; Lowestoft=4; Great Yarmouth=4; King's Lynn=4; Cromer=4; Ely=4; Grantham=4; Boston=4; Skegness=4; Stamford=4; Matlock=4; Buxton=4;
Bakewell=4; Macclesfield=4; Tamworth=4; Ludlow=4; Tewkesbury=4; Stroud=4; Cirencester=4; Chippenham=4; Wells=4; Glastonbury=4; Taunton=4; Yeovil=4; Weston-super-Mare=4; Barnstaple=4; Ilfracombe=4;
Exmouth=4; Paignton=4; Dartmouth=4; Bodmin=4; St Austell=4; Padstow=4; Dorchester=4; Weymouth=4; Poole=4; Lyme Regis=4; Christchurch=4; Chichester=4; Bognor Regis=4; Worthing=4; Horsham=4; Lewes=4;
Hove=4; Rye=4; Tunbridge Wells/Royal Tunbridge Wells=4; Maidstone=4; Folkestone=4; Ramsgate=4; Broadstairs=4; Whitstable=4; Rochester=4; Chatham=4; Gillingham=4; Dartford=4; Woking=4; Epsom=4;
Maidenhead=4; High Wycombe=4; Aylesbury=4; Henley-on-Thames/Henley=4; Abingdon=4; Newbury=4; Bracknell=4; Ascot=4; Aldershot=4; Farnborough=4; Andover=4; Fareham=4; Gosport=4; Dewsbury=4; Keighley=4;
Ilkley=4; Hebden Bridge=4; Accrington=4; Chorley=4; Widnes=4; Runcorn=4; Altrincham=4; Sale=4; Ashton-under-Lyne=4; Northwich=4; Redcar=4; Cleethorpes=4; Kirkcaldy=4; Dunfermline=4; Falkirk=4;
Livingston=4; East Kilbride=4; Motherwell=4; Hamilton=4; Greenock=4; Kilmarnock=4; Ayr=4; Dumfries=4; Elgin=4; Lerwick=4; Kirkwall=4; Stornoway=4; Portree=4; Aviemore=4; Pitlochry=4; Arbroath=4;
Carmarthen=4; Tenby=4; Pembroke=4; St Davids=4; Merthyr Tydfil=4; Bridgend=4; Barry=4; Pontypridd=4; Caerphilly=4; Rhyl=4; Conwy=4; Caernarfon=4; Holyhead=4; Llanelli=4; Port Talbot=4; Abergavenny=4;
Brecon=4; Hay-on-Wye=4; Lisburn=4; Newry=4; Armagh=4; Enniskillen=4; Coleraine=4; Portrush=4; Ballymena=4; Omagh=4; Gretna Green/Gretna=4; John o' Groats=4; Tintagel=4;
Whitehaven=5; Selby=5; Tynemouth=5; Whitley Bay=5; Kidderminster=5; Wellingborough=5; Hertford=5; Brentwood=5; Huntingdon=5; Newark/Newark-on-Trent=5; Worksop=5; Nantwich=5; Leek=5; Uttoxeter=5;
Cannock=5; Leominster=5; Ross-on-Wye=5; Trowbridge=5; Devizes=5; Marlborough=5; Bridgwater=5; Minehead=5; Bideford=5; Brixham=5; Totnes=5; Newton Abbot=5; Tavistock=5; Bude=5; Looe=5; Bridport=5;
Shaftesbury=5; Sherborne=5; Petersfield=5; Havant=5; Littlehampton=5; Tonbridge=5; Sevenoaks=5; Ashford=5; Deal=5; Faversham=5; Sittingbourne=5; Gravesend=5; Reigate=5; Dorking=5; Farnham=5;
Camberley=5; Staines=5; Amersham=5; Didcot=5; Wokingham=5; Pontefract=5; Glossop=5; Ormskirk=5; Saltburn-by-the-Sea/Saltburn=5; Thirsk=5; Northallerton=5; Richmond=5; Hawes=5; Malton=5; Pickering=5;
Helmsley=5; Haworth=5; Holmfirth=5; Otley=5; Knaresborough=5; Goole=5; Cumbernauld=5; Irvine=5; Glenrothes=5; Peebles=5; Galashiels=5; Hawick=5; Montrose=5; Wick=5; Thurso=5; Dingwall=5; Nairn=5;
Forres=5; Ullapool=5; Kirkcudbright=5; Stranraer=5; Largs=5; Helensburgh=5; Dunoon=5; Crieff=5; Dunblane=5; Callander=5; Neath=5; Llandrindod Wells=5; Machynlleth=5; Dolgellau=5; Betws-y-Coed=5;
Portmeirion=5; Beaumaris=5; Fishguard=5; Haverfordwest=5; Cardigan=5; Llangollen=5; Ebbw Vale=5; Cwmbran=5; Larne=5; Antrim=5; Downpatrick=5; Craigavon=5; Newtownards=5; Strabane=5; Cookstown=5;
Dungannon=5; Banbridge=5; Llanfairpwllgwyngyll/Llanfair PG/Llanfairpwll=5; Bletchley=5; Corfe Castle=5; Lavenham=5; Bourton-on-the-Water=5; Chipping Norton=5; Broadway=5; Wantage=5; Thame=5;
Marlow=5; Beaconsfield=5; Hitchin=5; Letchworth=5; Welwyn Garden City=5; Saffron Walden=5; Southwold=5; Aldeburgh=5; Sandringham=5; Wells-next-the-Sea=5; Hunstanton=5; Louth=5; Spalding=5; Oakham=5;
Market Harborough=5; Hinckley=5; Melton Mowbray=5; Ashbourne=5; Bewdley=5; Malvern=5; Evesham=5; Pershore=5; Ledbury=5; Bromsgrove=5; Stourbridge=5; Sutton Coldfield=5; Bridgnorth=5; Oswestry=5;
Whitchurch=5; Knutsford=5; Wilmslow=5; Congleton=5; Ellesmere Port=5; Bootle=5; Formby=5; Lytham St Annes=5; Fleetwood=5; Clitheroe=5; Ulverston=5; Penrith=5; Cockermouth=5; Workington=5; Consett=5;
Bishop Auckland=5; Seaham=5; Peterlee=5; Morpeth=5; Cramlington=5; Ashington=5; Blyth=5; Bamburgh=5; Seahouses=5` },

{ id: 'geo-germany-city', cat: 'Geography', q: 'Name a city in Germany', a: `
Berlin=1; Munich/Munchen=1; Hamburg=1; Frankfurt/Frankfurt am Main=1; Cologne/Koln=1;
Dusseldorf=2; Stuttgart=2; Dresden=2; Leipzig=2; Bonn=2; Hanover/Hannover=2; Nuremberg/Nurnberg=2; Heidelberg=2; Bremen=2; Dortmund=2;
Essen=3; Duisburg=3; Bochum=3; Gelsenkirchen=3; Wuppertal=3; Bielefeld=3; Munster=3; Aachen/Aix-la-Chapelle=3; Mainz=3; Wiesbaden=3; Freiburg=3; Karlsruhe=3; Mannheim=3; Augsburg=3; Regensburg=3;
Wurzburg=3; Rostock=3; Kiel=3; Lubeck=3; Potsdam=3; Magdeburg=3; Erfurt=3; Weimar=3; Kassel=3; Gottingen=3; Brunswick/Braunschweig=3; Wolfsburg=3; Ulm=3; Konstanz/Constance=3; Trier=3; Koblenz=3;
Baden-Baden=3; Bamberg=3; Rothenburg ob der Tauber/Rothenburg=3; Garmisch-Partenkirchen/Garmisch=3; Berchtesgaden=3; Passau=3; Ingolstadt=3; Chemnitz/Karl-Marx-Stadt=3; Halle=3; Saarbrucken=3;
Jena=3;
Oldenburg=4; Osnabruck=4; Bremerhaven=4; Flensburg=4; Schwerin=4; Stralsund=4; Greifswald=4; Wismar=4; Cottbus=4; Zwickau=4; Gorlitz=4; Meissen=4; Eisenach=4; Goslar=4; Hildesheim=4; Celle=4;
Luneburg=4; Hamelin/Hameln=4; Paderborn=4; Hagen=4; Solingen=4; Krefeld=4; Monchengladbach=4; Leverkusen=4; Oberhausen=4; Darmstadt=4; Offenbach=4; Fulda=4; Marburg=4; Ludwigshafen=4;
Kaiserslautern=4; Worms=4; Speyer=4; Heilbronn=4; Tubingen=4; Friedrichshafen=4; Fussen=4; Oberammergau=4; Bayreuth=4; Erlangen=4; Furth=4; Coburg=4; Dachau=4; Dessau=4;
Wittenberg/Lutherstadt Wittenberg=4;
Frankfurt an der Oder/Frankfurt (Oder)=5; Plauen=5; Bautzen=5; Gotha=5; Quedlinburg=5; Wernigerode=5; Siegen=5; Remscheid=5; Neuss=5; Mulheim/Mulheim an der Ruhr=5; Recklinghausen=5; Herne=5; Hamm=5;
Giessen=5; Pforzheim=5; Reutlingen=5; Esslingen=5; Ludwigsburg=5; Lindau=5; Kempten=5; Hof=5; Landshut=5; Rosenheim=5; Oberstdorf=5; Herzogenaurach=5; Sindelfingen=5; Bad Homburg=5; Wetzlar=5;
Naumburg=5; Halberstadt=5; Neubrandenburg=5; Eberswalde=5; Brandenburg an der Havel=5; Oranienburg=5; Hanau=5; Rudesheim=5; Bingen=5; Bacharach=5; Cochem=5; Bernkastel-Kues=5; Idar-Oberstein=5;
Saarlouis=5; Ludwigslust=5; Wurzen=5; Freiberg=5; Pirna=5; Gera=5; Suhl=5; Ilmenau=5; Nordhausen=5; Bocholt=5; Gutersloh=5; Minden=5; Detmold=5; Lemgo=5; Emden=5; Wilhelmshaven=5; Cuxhaven=5;
Husum=5; Westerland=5; Neumunster=5; Itzehoe=5; Lauenburg=5; Salzgitter=5; Wolfenbuttel=5; Peine=5; Gifhorn=5; Uelzen=5; Stade=5; Verden=5; Nienburg=5; Vechta=5; Lingen=5; Meppen=5; Papenburg=5;
Leer=5; Aurich=5; Norden=5; Duren=5; Euskirchen=5; Bergisch Gladbach=5; Siegburg=5; Konigswinter=5; Gummersbach=5; Iserlohn=5; Arnsberg=5; Soest=5; Lippstadt=5; Witten=5; Bottrop=5; Marl=5;
Dorsten=5; Moers=5; Wesel=5; Kleve=5; Xanten=5; Kevelaer=5; Viersen=5; Monschau=5; Garching=5; Freising=5; Erding=5; Starnberg=5; Murnau=5; Mittenwald=5; Bad Reichenhall=5; Traunstein=5; Altotting=5;
Straubing=5; Deggendorf=5; Amberg=5; Weiden=5; Schweinfurt=5; Aschaffenburg=5; Ansbach=5; Dinkelsbuhl=5; Nordlingen=5; Donauworth=5; Memmingen=5; Neu-Ulm=5; Biberach=5; Ravensburg=5; Meersburg=5;
Uberlingen=5; Singen=5; Villingen-Schwenningen=5; Rottweil=5; Offenburg=5; Lahr=5; Kehl=5; Rastatt=5; Bruchsal=5; Schwetzingen=5; Weinheim=5; Sinsheim=5; Schwabisch Hall=5; Aalen=5; Heidenheim=5;
Goppingen=5; Boblingen=5; Waiblingen=5` },

{ id: 'geo-france-city', cat: 'Geography', q: 'Name a town or city in France', a: `
Paris=1; Marseille/Marseilles=1; Lyon/Lyons=1; Nice=1; Bordeaux=1;
Toulouse=2; Cannes=2; Lille=2; Strasbourg=2; Nantes=2; Montpellier=2; Avignon=2; Calais=2; Versailles=2;
Rennes=3; Reims/Rheims=3; Le Havre=3; Saint-Etienne/St Etienne=3; Toulon=3; Grenoble=3; Dijon=3; Angers=3; Nimes=3; Aix-en-Provence/Aix=3; Brest=3; Le Mans=3; Amiens=3; Tours=3; Limoges=3;
Clermont-Ferrand=3; Perpignan=3; Metz=3; Besancon=3; Orleans=3; Rouen=3; Caen=3; Nancy=3; Biarritz=3; Saint-Tropez/St Tropez=3; Chamonix=3; Lourdes=3; Carcassonne=3; Arles=3; Antibes=3; Menton=3;
Dunkirk/Dunkerque=3; Boulogne-sur-Mer/Boulogne=3; Cherbourg=3; Saint-Malo/St Malo=3; La Rochelle=3; Annecy=3; Ajaccio=3; Chartres=3; Cognac=3;
Bastia=4; Pau=4; Bayonne=4; Poitiers=4; Troyes=4; Epernay=4; Colmar=4; Mulhouse=4; Grasse=4; Frejus=4; Sete=4; Beziers=4; Narbonne=4; Albi=4; Cahors=4; Sarlat/Sarlat-la-Caneda=4; Bergerac=4;
Perigueux=4; Angouleme=4; Vannes=4; Lorient=4; Quimper=4; Saint-Nazaire=4; Vichy=4; Valence=4; Montelimar=4; Orange=4; Chambery=4; Evian/Evian-les-Bains=4; Megeve=4; Courchevel=4; Val d'Isere=4;
Briancon=4; Saint-Denis=4; Fontainebleau=4; Giverny=4; Deauville=4; Honfleur=4; Bayeux=4; Etretat=4; Dieppe=4; Beauvais=4; Compiegne=4; Verdun=4; Lens=4; Arras=4; Roubaix=4; Valenciennes=4;
Le Touquet=4; Auxerre=4; Beaune=4; Bourges=4; Blois=4; Amboise=4; Saumur=4; Mont-Saint-Michel=4; Millau=4; Arcachon=4; Saint-Jean-de-Luz=4; Cassis=4; Bonifacio=4; Chantilly=4;
Calvi=5; Montauban=5; Rocamadour=5; Niort=5; Laval=5; Aix-les-Bains=5; Hyeres=5; Nanterre=5; Boulogne-Billancourt=5; Vincennes=5; Sedan=5; Tourcoing=5; Macon=5; Vienne=5; Chinon=5;
Le Puy-en-Velay/Le Puy=5; Aurillac=5; Rodez=5; Foix=5; Tarbes=5; Agen=5; Mont-de-Marsan=5; Dax=5; Hendaye=5; Collioure=5; Ceret=5; Uzes=5; Gordes=5; Roussillon=5; Saint-Remy-de-Provence/St Remy=5;
Les Baux-de-Provence=5; Aigues-Mortes=5; Saintes-Maries-de-la-Mer=5; La Ciotat=5; Aubagne=5; Martigues=5; Salon-de-Provence=5; Manosque=5; Sisteron=5; Digne-les-Bains=5; Gap=5; Embrun=5;
Saint-Paul-de-Vence=5; Vence=5; Cagnes-sur-Mer=5; Villefranche-sur-Mer=5; Eze=5; Juan-les-Pins=5; Saint-Raphael=5; Sainte-Maxime=5; Porto-Vecchio=5; Corte=5; Gravelines=5; Le Crotoy=5; Abbeville=5;
Saint-Quentin=5; Laon=5; Soissons=5; Charleville-Mezieres=5; Chalons-en-Champagne=5; Bar-le-Duc=5; Epinal=5; Thionville=5; Saverne=5; Haguenau=5; Selestat=5; Riquewihr=5; Belfort=5; Montbeliard=5;
Pontarlier=5; Dole=5; Lons-le-Saunier=5; Bourg-en-Bresse=5; Annemasse=5; Thonon-les-Bains=5; Albertville=5; Val Thorens=5; Tignes=5; Les Arcs=5; Meribel=5; Alpe d'Huez=5; Morzine=5; Roanne=5;
Le Creusot=5; Nevers=5; Moulins=5; Montlucon=5; Chateauroux=5; Vierzon=5; Chateaudun=5; Evreux=5; Lisieux=5; Alencon=5; Granville=5; Saint-Lo=5; Coutances=5; Avranches=5; Dinan=5; Dinard=5;
Saint-Brieuc=5; Morlaix=5; Concarneau=5; Carnac=5; Quiberon=5; Guerande=5; La Baule=5; Cholet=5; Les Sables-d'Olonne=5; La Roche-sur-Yon=5; Rochefort=5; Royan=5; Saintes=5; Libourne=5;
Saint-Emilion=5; Biscarrosse=5; Lacanau=5; Hossegor=5; Oloron-Sainte-Marie=5; Saint-Jean-Pied-de-Port=5; Castres=5; Limoux=5; Lunel=5; Ales=5; Mende=5; Le Mont-Dore=5; Thiers=5; Brive-la-Gaillarde=5;
Tulle=5; Gueret=5; Oradour-sur-Glane=5; Nogent-sur-Marne=5; Creteil=5; Argenteuil=5; Montreuil=5; Saint-Germain-en-Laye=5; Neuilly-sur-Seine=5; Marne-la-Vallee=5; Senlis=5; Rambouillet=5; Provins=5;
Meaux=5; Melun=5; Evry=5; Cergy=5; Pontoise=5; Saint-Ouen=5; Issy-les-Moulineaux=5` },

{ id: 'geo-spain-city', cat: 'Geography', q: 'Name a town or city in Spain', a: `
Madrid=1; Barcelona=1; Seville/Sevilla=1; Valencia=1; Malaga=1;
Bilbao=2; Granada=2; Toledo=2; Cordoba=2; Salamanca=2; San Sebastian/Donostia=2; Palma/Palma de Mallorca=2; Benidorm=2; Marbella=2; Zaragoza/Saragossa=2; Ibiza/Eivissa=2;
Alicante=3; Murcia=3; Cadiz=3; Pamplona/Iruna=3; Santiago de Compostela/Santiago=3; Valladolid=3; Segovia=3; Avila=3; Burgos=3; Leon=3; Oviedo=3; Gijon=3; Santander=3; A Coruna/La Coruna/Corunna=3;
Vigo=3; Almeria=3; Jerez/Jerez de la Frontera=3; Ronda=3; Torremolinos=3; Fuengirola=3; Estepona=3; Nerja=3; Tarragona=3; Girona/Gerona=3; Sitges=3; Las Palmas/Las Palmas de Gran Canaria=3;
Santa Cruz de Tenerife/Santa Cruz=3; Magaluf=3; San Antonio/Sant Antoni=3; Lloret de Mar=3; Salou=3;
Puerto Banus=4; Mijas=4; Benalmadena=4; Torrevieja=4; Elche=4; Cartagena=4; Lleida/Lerida=4; Cuenca=4; Caceres=4; Merida=4; Badajoz=4; Huelva=4; Jaen=4; Ubeda=4; Logrono=4; Vitoria/Vitoria-Gasteiz=4;
Teruel=4; Huesca=4; Zamora=4; Lugo=4; Pontevedra=4; Albacete=4; Guadalajara=4; Aranjuez=4; Alcala de Henares=4; El Escorial/San Lorenzo de El Escorial=4; Arrecife=4; Puerto de la Cruz=4;
Playa de las Americas=4; Los Cristianos=4; Maspalomas=4; Playa del Ingles=4; Corralejo=4; Puerto del Carmen=4; Mahon/Mao=4; Ciutadella=4; Tossa de Mar=4; Figueres=4; Cadaques=4; Reus=4;
Castellon/Castellon de la Plana=4; Gandia=4; Denia=4; Javea/Xabia=4; Calpe/Calp=4; Altea=4; Lorca=4; Algeciras=4; Tarifa=4; Ceuta=4; Melilla=4; Pollensa/Pollenca=4; Alcudia=4; Soller=4; Peniscola=4;
La Manga=4; Mojacar=4; Antequera=4; Trujillo=4; Badalona=4; Gernika/Guernica=4;
Baeza=5; Soria=5; Palencia=5; Ourense/Orense=5; Ciudad Real=5; Costa Adeje=5; Valldemossa=5; Deia=5; Cala d'Or=5; Santa Eulalia=5; Benicassim=5; Sagunto=5; Xativa=5; Alcoy/Alcoi=5; Orihuela=5;
Aguilas=5; Mazarron=5; Roquetas de Mar=5; Motril=5; Almunecar=5; Osuna=5; Carmona=5; Ecija=5; Arcos de la Frontera=5; Vejer de la Frontera=5; Conil=5; Chipiona=5; Sanlucar de Barrameda=5;
El Puerto de Santa Maria=5; Rota=5; Zahara de los Atunes=5; Setenil de las Bodegas=5; Grazalema=5; Frigiliana=5; Rincon de la Victoria=5; Torrox=5; Manilva=5; Sotogrande=5;
La Linea de la Concepcion/La Linea=5; Plasencia=5; Guadalupe=5; Talavera de la Reina=5; Almagro=5; Consuegra=5; Siguenza=5; Chinchon=5; Getafe=5; Leganes=5; Mostoles=5; Alcorcon=5; Fuenlabrada=5;
Alcobendas=5; Las Rozas=5; Majadahonda=5; Pozuelo=5; Hospitalet/L'Hospitalet de Llobregat=5; Sabadell=5; Terrassa=5; Mataro=5; Granollers=5; Vic=5; Manresa=5; Tortosa=5; Cambrils=5; Calella=5;
Blanes=5; Palamos=5; Begur=5; Roses=5; Olot=5; Besalu=5; Puigcerda=5; Jaca=5; Calatayud=5; Tudela=5; Estella=5; Olite=5; Getxo=5; Durango=5; Eibar=5; Irun=5; Hondarribia/Fuenterrabia=5; Zarautz=5;
Laredo=5; Santillana del Mar=5; Comillas=5; Torrelavega=5; Aviles=5; Llanes=5; Cangas de Onis=5; Ribadesella=5; Ponferrada=5; Astorga=5; Ferrol=5; Finisterre/Fisterra=5; Sanxenxo=5; Cambados=5;
Baiona=5; Tui=5; Medina del Campo=5; Tordesillas=5; Penafiel=5; Aranda de Duero=5; Miranda de Ebro=5; Haro=5` },

{ id: 'geo-australia-city', cat: 'Geography', q: 'Name a town or city in Australia', a: `
Sydney=1; Melbourne=1; Brisbane=1; Perth=1; Adelaide=1; Canberra=1;
Darwin=2; Hobart=2; Gold Coast=2; Cairns=2; Alice Springs=2;
Newcastle=3; Wollongong=3; Geelong=3; Townsville=3; Toowoomba=3; Ballarat=3; Bendigo=3; Launceston=3; Sunshine Coast=3; Byron Bay=3; Broome=3; Mackay=3; Rockhampton=3; Bundaberg=3; Coffs Harbour=3;
Port Macquarie=3; Wagga Wagga=3; Albury=3; Mildura=3; Dubbo=3; Broken Hill=3; Kalgoorlie=3; Fremantle=3; Noosa=3; Surfers Paradise=3; Parramatta=3; Katherine=3; Coober Pedy=3; Port Douglas=3;
Airlie Beach=3; Hervey Bay=3; Margaret River=3;
Wodonga=4; Orange=4; Bathurst=4; Tamworth=4; Armidale=4; Lismore=4; Bunbury=4; Albany=4; Geraldton=4; Esperance=4; Port Hedland=4; Karratha=4; Exmouth=4; Mount Gambier=4; Port Augusta=4;
Port Lincoln=4; Whyalla=4; Tennant Creek=4; Mount Isa=4; Longreach=4; Gladstone=4; Maroochydore=4; Caloundra=4; Ipswich=4; Logan=4; Devonport=4; Burnie=4; Shepparton=4; Warrnambool=4; Traralgon=4;
Echuca=4; Queanbeyan=4; Goulburn=4; Cooma=4; Katoomba=4; Gosford=4; Maitland=4; Cessnock=4; Nowra=4; Kiama=4; Griffith=4; Tweed Heads=4; Cooktown=4; Port Arthur=4; Victor Harbor=4; Kununurra=4;
Mandurah=4; Rockingham=4; Joondalup=4; Gympie=4; Emerald=4; Charters Towers=4; Bowen=4; Lorne=4; Torquay=4; Sorrento=4; Swan Hill=4; Wangaratta=4; Horsham=4; Ballina=4; Yamba=4; Penrith=4;
Liverpool=4; Wyong=4; Hahndorf=4; Thredbo=4; Jindabyne=4; Bright=4; Beechworth=4; Daylesford=4; Kalbarri=4; Carnarvon=4; Derby=4; Yulara=4; Strahan=4; Queenstown=4; Richmond=4; Batemans Bay=4;
Mudgee=4; Parkes=4; Grafton=4; Bowral=4; Bourke=4; Busselton=4; Kuranda=4; Maryborough=4; Birdsville=4; Coolangatta=4;
St Helens=5; Bicheno=5; Coles Bay=5; Stanley=5; Ulladulla=5; Merimbula=5; Eden=5; Bega=5; Cowra=5; Young=5; Forbes=5; Moree=5; Inverell=5; Glen Innes=5; Tenterfield=5; Kempsey=5; Taree=5; Forster=5;
Muswellbrook=5; Singleton=5; Scone=5; Lithgow=5; Wentworth=5; Hay=5; Deniliquin=5; Leeton=5; Narrandera=5; Cobar=5; Lightning Ridge=5; White Cliffs=5; Wilcannia=5; Tibooburra=5; Mount Barker=5;
Murray Bridge=5; Renmark=5; Berri=5; Loxton=5; Clare=5; Tanunda=5; Nuriootpa=5; Kadina=5; Moonta=5; Wallaroo=5; Port Pirie=5; Ceduna=5; Roxby Downs=5; Andamooka=5; Kingscote=5; Naracoorte=5; Robe=5;
Portland=5; Port Fairy=5; Hamilton=5; Ararat=5; Stawell=5; Halls Gap=5; Castlemaine=5; Kyneton=5; Seymour=5; Benalla=5; Mansfield=5; Sale=5; Bairnsdale=5; Lakes Entrance=5; Orbost=5; Wonthaggi=5;
Inverloch=5; Cowes=5; Frankston=5; Dandenong=5; Healesville=5; Warburton=5; Apollo Bay=5; Colac=5; Port Campbell=5; Ocean Grove=5; Queenscliff=5; Werribee=5; Melton=5; Sunbury=5; Gisborne=5;
Bacchus Marsh=5; Tom Price=5; Newman=5; Paraburdoo=5; Onslow=5; Denham=5; Northam=5; Merredin=5; Narrogin=5; Dunsborough=5; Augusta=5; Denmark=5; Collie=5; Halls Creek=5; Fitzroy Crossing=5;
Wyndham=5; Jabiru=5; Nhulunbuy=5; Weipa=5; Thursday Island=5; Mareeba=5; Atherton=5; Mission Beach=5; Innisfail=5; Tully=5; Ingham=5; Ayr=5; Proserpine=5; Yeppoon=5; Biloela=5; Roma=5; Dalby=5;
Warwick=5; Stanthorpe=5; Goondiwindi=5; Kingaroy=5; Childers=5; Agnes Water=5; Winton=5; Cloncurry=5; Charleville=5; Cunnamulla=5; Barcaldine=5; Mooloolaba=5; Southport=5; Nambour=5; Redcliffe=5;
Caboolture=5; Cleveland=5; Kingston=5; Glenorchy=5; Huonville=5; New Norfolk=5; Sorell=5; George Town=5; Deloraine=5; Smithton=5; Palmerston=5; Batchelor=5` },

{ id: 'geo-india-city', cat: 'Geography', q: 'Name a city in India', a: `
Mumbai/Bombay=1; Delhi/New Delhi=1; Kolkata/Calcutta=1; Chennai/Madras=1; Bangalore/Bengaluru=1;
Hyderabad=2; Agra=2; Jaipur=2; Varanasi/Benares/Banaras=2; Pune/Poona=2; Ahmedabad=2; Amritsar=2;
Lucknow=3; Kanpur/Cawnpore=3; Surat=3; Udaipur=3; Jodhpur=3; Jaisalmer=3; Pushkar=3; Rishikesh=3; Haridwar=3; Shimla/Simla=3; Darjeeling=3; Srinagar=3; Leh=3; Manali=3;
Dharamshala/Dharamsala/McLeod Ganj=3; Chandigarh=3; Bhopal=3; Indore=3; Nagpur=3; Patna=3; Kochi/Cochin=3; Thiruvananthapuram/Trivandrum=3; Mysore/Mysuru=3; Madurai=3; Coimbatore=3;
Pondicherry/Puducherry=3; Panaji/Panjim=3; Mangalore/Mangaluru=3; Visakhapatnam/Vizag=3; Guwahati=3; Shillong=3; Gangtok=3; Ranchi=3; Dehradun=3; Allahabad/Prayagraj=3; Gwalior=3; Khajuraho=3;
Vadodara/Baroda=3; Mathura=3; Ayodhya=3; Bodh Gaya=3; Noida=3; Gurgaon/Gurugram=3; Ooty/Udhagamandalam=3; Kanyakumari=3; Puri=3; Bhubaneswar=3;
Vijayawada=4; Raipur=4; Mussoorie=4; Nainital=4; Ujjain=4; Aurangabad/Chhatrapati Sambhajinagar=4; Nashik=4; Kolhapur=4; Rajkot=4; Jamnagar=4; Gandhinagar=4; Ajmer=4; Bikaner=4; Kota=4; Vrindavan=4;
Gaya=4; Meerut=4; Ghaziabad=4; Faridabad=4; Ludhiana=4; Jalandhar=4; Jammu=4; Imphal=4; Aizawl=4; Kohima=4; Agartala=4; Itanagar=4; Siliguri=4; Howrah=4; Jamshedpur=4; Dhanbad=4; Cuttack=4; Hampi=4;
Kodaikanal=4; Thanjavur/Tanjore=4; Tiruchirappalli/Trichy=4; Mahabalipuram/Mamallapuram=4; Rameswaram=4; Tirupati=4; Warangal=4; Hubli/Hubballi=4; Belgaum/Belagavi=4; Kozhikode/Calicut=4; Thrissur=4;
Alappuzha/Alleppey=4; Munnar=4; Varkala=4; Port Blair/Sri Vijaya Puram=4; Shirdi=4; Lonavala=4; Mount Abu=4; Chittorgarh=4; Aligarh=4; Bareilly=4; Gorakhpur=4; Jhansi=4; Jabalpur=4; Konark=4;
Cherrapunji/Sohra=4; Gulmarg=4; Fatehpur Sikri=4; Bhuj=4; Dwarka=4; Porbandar=4; Thane=4; Navi Mumbai=4; Margao/Madgaon=4; Vasco da Gama=4; Kanchipuram=4; Secunderabad=4;
Bhavnagar=5; Asansol=5; Durgapur=5; Guntur=5; Nellore=5; Kollam/Quilon=5; Daman=5; Diu=5; Matheran=5; Bharatpur=5; Sawai Madhopur=5; Bilaspur=5; Sagar=5; Rewa=5; Satna=5; Orchha=5; Mandu=5; Sanchi=5;
Pachmarhi=5; Bhilai=5; Durg=5; Rourkela=5; Sambalpur=5; Berhampur=5; Dibrugarh=5; Jorhat=5; Tezpur=5; Silchar=5; Tawang=5; Kalimpong=5; Haldia=5; Kharagpur=5; Bardhaman=5; Malda=5; Muzaffarpur=5;
Bhagalpur=5; Darbhanga=5; Rajgir=5; Deoghar=5; Bokaro=5; Hazaribagh=5; Kurukshetra=5; Panipat=5; Ambala=5; Karnal=5; Rohtak=5; Hisar=5; Sonipat=5; Patiala=5; Bathinda=5; Pathankot=5; Mohali=5;
Kasauli=5; Solan=5; Dalhousie=5; Kullu=5; Kargil=5; Pahalgam=5; Anantnag=5; Katra=5; Almora=5; Haldwani=5; Roorkee=5; Kedarnath=5; Badrinath=5; Saharanpur=5; Muzaffarnagar=5; Moradabad=5; Rampur=5;
Firozabad=5; Etawah=5; Mirzapur=5; Sarnath=5; Kushinagar=5; Alwar=5; Bundi=5; Sikar=5; Jhunjhunu=5; Mandawa=5; Barmer=5; Somnath=5; Junagadh=5; Anand=5; Bharuch=5; Navsari=5; Vapi=5; Silvassa=5;
Kalyan=5; Vasai=5; Panvel=5; Alibag=5; Ratnagiri=5; Sangli=5; Satara=5; Solapur=5; Ahmednagar=5; Latur=5; Nanded=5; Amravati=5; Akola=5; Jalgaon=5; Wardha=5; Mahabaleshwar=5; Mapusa=5; Calangute=5;
Karwar=5; Gokarna=5; Udupi=5; Manipal=5; Shimoga/Shivamogga=5; Davanagere=5; Bellary/Ballari=5; Gulbarga/Kalaburagi=5; Bijapur/Vijayapura=5; Badami=5; Madikeri=5; Hassan=5; Mandya=5; Salem=5;
Erode=5; Tiruppur=5; Vellore=5; Chidambaram=5; Kumbakonam=5; Tirunelveli=5; Thoothukudi/Tuticorin=5; Nagercoil=5; Karaikudi=5; Kottayam=5; Palakkad=5; Kannur=5; Kasaragod=5; Kakinada=5;
Rajahmundry=5; Kurnool=5; Anantapur=5; Nizamabad=5; Karimnagar=5; Amaravati=5` },

{ id: 'geo-china-city', cat: 'Geography', q: 'Name a city in China', a: `
Beijing/Peking=1; Shanghai=1; Hong Kong=1;
Wuhan=2; Guangzhou/Canton=2; Shenzhen=2; Xi'an=2; Chengdu=2; Macau/Macao=2; Nanjing/Nanking=2; Chongqing/Chungking=2;
Tianjin/Tientsin=3; Hangzhou=3; Suzhou=3; Harbin=3; Shenyang/Mukden=3; Dalian=3; Qingdao/Tsingtao=3; Kunming=3; Guilin=3; Lhasa=3; Xiamen/Amoy=3; Urumqi=3; Kashgar/Kashi=3; Sanya=3; Lijiang=3;
Zhuhai=3; Dongguan=3;
Fuzhou=4; Changsha=4; Zhengzhou=4; Jinan=4; Taiyuan=4; Hefei=4; Nanchang=4; Nanning=4; Guiyang=4; Lanzhou=4; Hohhot=4; Changchun=4; Shijiazhuang=4; Xining=4; Yinchuan=4; Haikou=4; Ningbo=4;
Wenzhou=4; Foshan=4; Shantou/Swatow=4; Yangzhou=4; Wuxi=4; Changzhou=4; Luoyang=4; Kaifeng=4; Datong=4; Pingyao=4; Qufu=4; Dunhuang=4; Turpan/Turfan=4; Dali=4; Shangri-La/Zhongdian=4; Yangshuo=4;
Zhangjiajie=4; Huangshan=4; Leshan=4; Chengde=4; Qinhuangdao=4; Baotou=4; Tangshan=4; Yantai=4; Weihai=4; Xuzhou=4; Shaoxing=4; Jingdezhen=4; Yichang=4; Liuzhou=4; Zunyi=4; Yan'an=4; Jiayuguan=4;
Golmud=4; Daqing=4; Qiqihar=4; Jilin City=4; Ordos=4; Dandong=4; Yiwu=4; Quanzhou=4; Anyang=4; Fenghuang=4; Shigatse/Xigaze=4;
Anshan=5; Fushun=5; Handan=5; Zibo=5; Nantong=5; Jiaxing=5; Wuhu=5; Jiujiang=5; Xiangyang=5; Zhuzhou=5; Yueyang=5; Shaoshan=5; Beihai=5; Mianyang=5; Yibin=5; Zigong=5; Xianyang=5; Baoji=5;
Mudanjiang=5; Hulunbuir=5; Manzhouli=5; Erenhot=5; Hailar=5; Jiamusi=5; Heihe=5; Mohe=5; Tonghua=5; Yanji=5; Siping=5; Benxi=5; Jinzhou=5; Yingkou=5; Langfang=5; Baoding=5; Cangzhou=5; Zhangjiakou=5;
Xingtai=5; Linfen=5; Changzhi=5; Yuncheng=5; Weifang=5; Linyi=5; Jining=5; Tai'an=5; Dongying=5; Rizhao=5; Yangquan=5; Kunshan=5; Taizhou=5; Huzhou=5; Jinhua=5; Lishui=5; Zhangzhou=5; Putian=5;
Longyan=5; Ganzhou=5; Shangrao=5; Wuyishan=5; Anqing=5; Bengbu=5; Huainan=5; Ma'anshan=5; Xinyang=5; Nanyang=5; Xinxiang=5; Pingdingshan=5; Shiyan=5; Jingzhou=5; Huangshi=5; Changde=5; Hengyang=5;
Zhaoqing=5; Huizhou=5; Jiangmen=5; Zhongshan=5; Zhanjiang=5; Maoming=5; Meizhou=5; Qingyuan=5; Shaoguan=5; Wuzhou=5; Guigang=5; Yulin=5; Kaili=5; Anshun=5; Panzhihua=5; Xichang=5; Dujiangyan=5;
Emeishan=5; Ya'an=5; Kangding=5; Nanchong=5; Luzhou=5; Dazu=5; Wanzhou=5; Fuling=5; Hanzhong=5; Ankang=5; Tianshui=5; Zhangye=5; Wuwei=5; Jiuquan=5; Xiahe=5; Gyantse=5; Nyingchi=5; Shannan=5; Hami=5;
Korla=5; Aksu=5; Hotan/Khotan=5; Yining/Ghulja=5; Karamay=5; Shihezi=5; Altay=5; Tashkurgan=5; Jinghong=5; Tengchong=5; Ruili=5; Puer=5; Qujing=5; Yuxi=5; Wuzhen=5; Zhouzhuang=5; Tongli=5;
Hengdian=5` },

{ id: 'geo-landmark', cat: 'Geography', q: 'Name a famous landmark or monument', a: `
Eiffel Tower=1; Statue of Liberty=1; Great Wall of China/Great Wall=1; Big Ben/Elizabeth Tower=1; Taj Mahal=1; Colosseum/Coliseum/Colosseo=1;
Pyramids of Giza/Pyramids/Great Pyramid/Great Pyramid of Giza/Giza Pyramids=1; Stonehenge=1; Leaning Tower of Pisa/Leaning Tower/Tower of Pisa/Pisa Tower=1; Machu Picchu=1; Mount Rushmore=1;
Golden Gate Bridge/Golden Gate=1;
Sydney Opera House/Opera House=2; Christ the Redeemer/Cristo Redentor=2; Petra=2; Great Sphinx/Sphinx/Sphinx of Giza=2; Parthenon=2; Acropolis=2; Buckingham Palace=2; Tower Bridge=2;
Tower of London=2; London Eye=2; Empire State Building=2; Arc de Triomphe=2; Notre-Dame/Notre-Dame de Paris=2; Louvre=2; Sagrada Familia=2; Kremlin=2; Angkor Wat=2; Chichen Itza=2; Burj Khalifa=2;
Brandenburg Gate=2; Lincoln Memorial=2; Washington Monument=2; White House=2; Hollywood Sign=2; Times Square=2; Grand Canyon=2; Niagara Falls=2; Uluru/Ayers Rock=2;
Red Square=3; St Basil's Cathedral/Saint Basil's Cathedral/St Basil's=3; Space Needle=3; Gateway Arch/St Louis Arch=3; Alamo=3; Brooklyn Bridge=3; Sydney Harbour Bridge/Harbour Bridge=3;
Forbidden City=3; Terracotta Army/Terracotta Warriors=3; Alhambra=3; Neuschwanstein/Neuschwanstein Castle=3; Westminster Abbey=3; St Paul's Cathedral/Saint Paul's Cathedral/St Paul's=3;
Trevi Fountain=3; Pantheon=3; St Peter's Basilica/Saint Peter's Basilica=3; Sistine Chapel=3; Hagia Sophia/Aya Sofya=3; Blue Mosque/Sultan Ahmed Mosque=3;
Moai/Easter Island Heads/Easter Island Statues=3; Petronas Towers/Petronas Twin Towers=3; CN Tower=3; Golden Temple/Harmandir Sahib=3; Mont-Saint-Michel/Mont St Michel=3;
Palace of Versailles/Versailles=3; Atomium=3; Little Mermaid=3; Manneken Pis=3; Berlin Wall=3; Reichstag=3; Edinburgh Castle=3; Windsor Castle=3; Hadrian's Wall=3; Angel of the North=3;
Trafalgar Square=3; Nelson's Column=3; Shard=3; Gherkin/30 St Mary Axe=3; Houses of Parliament/Palace of Westminster=3; Abu Simbel=3; Valley of the Kings=3; Hoover Dam=3; Alcatraz=3; Liberty Bell=3;
Capitol/US Capitol/Capitol Building=3; Jefferson Memorial=3; Pentagon=3; Willis Tower/Sears Tower=3; Chrysler Building=3; One World Trade Center/Freedom Tower=3; Twin Towers/World Trade Center=3;
Central Park=3; Grand Central Terminal/Grand Central Station/Grand Central=3; Hollywood Walk of Fame/Walk of Fame=3; Las Vegas Strip/The Strip=3; Graceland=3; Teotihuacan=3; Panama Canal=3;
Burj Al Arab=3; Western Wall/Wailing Wall=3; Dome of the Rock=3; Kaaba=3; Marina Bay Sands=3; Merlion=3; Tokyo Tower=3; Tokyo Skytree/Skytree=3; Great Barrier Reef=3; Giant's Causeway=3;
Cliffs of Moher=3; Blarney Castle/Blarney Stone=3; Hanging Gardens of Babylon/Hanging Gardens=3; Colossus of Rhodes=3; Pompeii=3; Spanish Steps=3; Roman Forum/Forum=3; Rialto Bridge=3;
St Mark's Basilica/Saint Mark's Basilica=3; St Mark's Square/Piazza San Marco=3; Ponte Vecchio=3; Florence Cathedral/Duomo=3; Charles Bridge=3; Prague Castle=3; Sacre-Coeur=3; Champs-Elysees=3;
Moulin Rouge=3; Piccadilly Circus=3; Blackpool Tower=3; Royal Albert Hall=3; Cutty Sark=3; Twelve Apostles=3; Tiananmen Square=3;
Mount Fuji=4; Lighthouse of Alexandria/Pharos of Alexandria=4; Milan Cathedral/Duomo di Milano=4; Table Mountain=4; Victoria Falls=4; Karnak/Karnak Temple=4; Luxor Temple=4; Temple of Artemis=4;
Mausoleum at Halicarnassus/Mausoleum of Halicarnassus=4; Statue of Zeus/Statue of Zeus at Olympia=4; Avebury=4; Rock of Cashel=4; Newgrange=4; Eilean Donan/Eilean Donan Castle=4;
Glenfinnan Viaduct=4; Wallace Monument=4; Forth Bridge=4; Kelpies=4; Caernarfon Castle=4; Clifton Suspension Bridge=4; Roman Baths=4; Hampton Court/Hampton Court Palace=4; Blenheim Palace=4;
Warwick Castle=4; Balmoral/Balmoral Castle=4; Canterbury Cathedral=4; York Minster=4; White Cliffs of Dover=4; Marble Arch=4; Stirling Castle=4; Cologne Cathedral=4; Schonbrunn Palace/Schonbrunn=4;
Hungarian Parliament/Hungarian Parliament Building=4; Bridge of Sighs=4; Doge's Palace=4; Prague Astronomical Clock/Astronomical Clock/Prague Orloj=4; Anne Frank House=4; Pont du Gard=4;
Chateau de Chambord/Chambord=4; Carcassonne/Cite de Carcassonne=4; Pompidou Centre/Centre Pompidou=4; Belem Tower/Torre de Belem=4; Pena Palace=4; Guggenheim/Guggenheim Bilbao/Guggenheim Museum=4;
Park Guell=4; Casa Batllo=4; Mezquita/Mosque-Cathedral of Cordoba=4; Aqueduct of Segovia/Segovia Aqueduct=4; Hermitage/Winter Palace=4; Lenin's Mausoleum=4; Bran Castle/Dracula's Castle=4; Meteora=4;
Delphi=4; Knossos=4; Hallgrimskirkja=4; Blue Lagoon=4; Topkapi Palace=4; Galata Tower=4; Ephesus=4; Persepolis=4; Palmyra=4; Masada=4; Church of the Holy Sepulchre=4;
Sheikh Zayed Mosque/Sheikh Zayed Grand Mosque=4; Palm Jumeirah=4; Red Fort=4; Qutub Minar/Qutb Minar=4; India Gate=4; Gateway of India=4; Hawa Mahal=4; Lotus Temple=4; Amber Fort/Amer Fort=4;
Victoria Memorial=4; Charminar=4; Statue of Unity=4; Ajanta Caves=4; Ellora Caves=4; Sigiriya=4; Shwedagon Pagoda=4; Bagan=4; Borobudur=4; Wat Arun=4; Grand Palace=4; Potala Palace=4;
Temple of Heaven=4; Summer Palace=4; Oriental Pearl Tower=4; Bund=4; Leshan Giant Buddha=4; Big Buddha/Tian Tan Buddha=4; Gardens by the Bay=4; Fushimi Inari/Fushimi Inari Shrine=4;
Kinkaku-ji/Golden Pavilion=4; Himeji Castle=4; Hiroshima Peace Memorial/Atomic Bomb Dome/Genbaku Dome=4; Shibuya Crossing=4; Taipei 101=4; Ha Long Bay=4; Great Zimbabwe=4; Hassan II Mosque=4;
Robben Island=4; Carthage=4; Independence Hall=4; Vietnam Veterans Memorial/Vietnam Wall=4; Arlington National Cemetery/Arlington Cemetery=4; Cloud Gate/The Bean=4; Flatiron Building=4;
Rockefeller Center=4; Crazy Horse Memorial=4; Devils Tower=4; Hearst Castle=4; Griffith Observatory=4; Madison Square Garden=4; Lombard Street=4; Pike Place Market=4; Route 66=4;
Las Vegas Sign/Welcome to Fabulous Las Vegas Sign=4; Old Faithful=4; Plymouth Rock=4; National Mall=4; Smithsonian=4; Ellis Island=4; Wall Street=4; Charging Bull/Wall Street Bull=4; Disneyland=4;
Walt Disney World/Disney World=4; Sugarloaf Mountain/Sugarloaf=4; Iguazu Falls=4; Nazca Lines=4; Tikal=4; Palenque=4; Tulum=4; Chateau Frontenac=4; Parliament Hill=4; Sky Tower=4; Hobbiton=4;
Three Gorges Dam=4;
Mount Everest=5; Valley of the Temples=5; Conwy Castle=5; Leeds Castle=5; Holyrood Palace/Palace of Holyroodhouse=5; Durham Cathedral=5; Salisbury Cathedral=5; Cerne Abbas Giant=5;
Uffington White Horse=5; Albert Memorial=5; Royal Observatory/Greenwich Observatory=5; Cenotaph=5; Monument to the Great Fire of London/The Monument=5; Titanic Belfast=5; Kylemore Abbey=5;
Spire of Dublin/Dublin Spire=5; Guinness Storehouse=5; Skara Brae=5; Ring of Brodgar=5; Callanish Stones=5; Iron Bridge=5; Tintagel Castle=5; Dover Castle=5; Urquhart Castle=5;
Brighton Pavilion/Royal Pavilion=5; Chain Bridge=5; Rijksmuseum=5; Kinderdijk=5; Lascaux=5; Musee d'Orsay=5; Casa Mila/La Pedrera=5; El Escorial=5; Alcazar of Seville/Real Alcazar=5;
Tivoli Gardens=5; Nyhavn=5; Kronborg Castle/Kronborg=5; Peterhof=5; The Motherland Calls=5; Palace of the Parliament=5; Olympia=5; Matterhorn=5; Baalbek=5; Dubai Frame=5; Kingdom Centre=5;
Masjid al-Haram/Grand Mosque=5; Prophet's Mosque=5; Mada'in Salih/Hegra=5; Mysore Palace=5; Konark Sun Temple=5; Meenakshi Temple=5; Temple of the Tooth=5; Prambanan=5; Wat Pho=5; Supertree Grove=5;
Itsukushima Shrine/Floating Torii=5; Great Buddha of Kamakura/Kamakura Daibutsu=5; Todai-ji=5; Senso-ji=5; Lotte World Tower=5; Gyeongbokgung=5; Angkor Thom=5; Bayon=5; Ta Prohm=5;
Banaue Rice Terraces=5; Chocolate Hills=5; Great Mosque of Djenne/Djenne Mosque=5; Lalibela/Rock-Hewn Churches of Lalibela=5; Leptis Magna=5; Aksum Obelisk/Obelisk of Axum=5; Kilimanjaro=5;
Biltmore Estate=5; Mesa Verde=5; Kennedy Space Center=5; Wrigley Field=5; Fenway Park=5; French Quarter=5; Bourbon Street=5; Bellagio Fountains=5; Martin Luther King Jr Memorial/MLK Memorial=5;
High Line=5; Coit Tower=5; Transamerica Pyramid=5; Hollywood Bowl=5; Chinese Theatre/TCL Chinese Theatre/Grauman's Chinese Theatre=5; Cinderella Castle=5; Fort Sumter=5; Monticello=5; Mount Vernon=5;
Stone Mountain=5; El Castillo/Temple of Kukulcan=5; Notre-Dame Basilica=5; Angel of Independence=5; Zocalo=5; Obelisco/Obelisk of Buenos Aires=5; Casa Rosada=5; Cristo de la Concordia=5;
Itaipu Dam=5; Salar de Uyuni=5; Ulun Danu=5; Tanah Lot=5; Golden Bridge=5` },

{ id: 'geo-ocean-sea', cat: 'Geography', q: 'Name an ocean, sea, gulf, bay or sound', a: `
Pacific Ocean/Pacific=1; Atlantic Ocean/Atlantic=1; Indian Ocean/Indian=1; Arctic Ocean/Arctic=1; Mediterranean Sea/Mediterranean/Med=1; Caribbean Sea/Caribbean=1; Gulf of Mexico/Gulf of America=1;
Southern Ocean/Antarctic Ocean=2; Red Sea=2; Dead Sea=2; Black Sea=2; North Sea=2; Baltic Sea/Baltic=2; Caspian Sea/Caspian=2; Irish Sea=2; Persian Gulf/Arabian Gulf/The Gulf=2; Bay of Bengal=2;
Hudson Bay=2; Arabian Sea=2; South China Sea=2; Adriatic Sea/Adriatic=2; Aegean Sea/Aegean=2; Sea of Japan/East Sea=2; Bay of Biscay=2; San Francisco Bay=2; Chesapeake Bay/Chesapeake=2; Coral Sea=2;
Tasman Sea=2; Bering Sea=2; Yellow Sea=2;
Celtic Sea=3; Cape Cod Bay=3; East China Sea=3; Philippine Sea=3; Sea of Okhotsk=3; Barents Sea=3; Beaufort Sea=3; Labrador Sea=3; Norwegian Sea=3; Sea of Marmara=3; Sea of Azov=3; Ionian Sea=3;
Tyrrhenian Sea=3; Aral Sea=3; Sargasso Sea=3; Andaman Sea=3; Sea of Galilee=3; Sea of Cortez=3; Bay of Fundy=3; Gulf of Aden=3; Gulf of Oman=3; Gulf of Thailand/Gulf of Siam=3; Gulf of Tonkin=3;
Gulf of Bothnia=3; Gulf of Finland=3; Gulf of California=3; Gulf of Alaska=3; Gulf of St Lawrence/Gulf of Saint Lawrence=3; Gulf of Maine=3; Gulf of Guinea=3; Gulf of Aqaba/Gulf of Eilat=3;
Gulf of Carpentaria=3; Bay of Naples/Gulf of Naples=3; Botany Bay=3; Tokyo Bay=3; Galway Bay=3; Monterey Bay=3; Tampa Bay=3; Baffin Bay=3; Bay of Pigs=3; Guantanamo Bay=3; Ha Long Bay=3;
Puget Sound=3; Long Island Sound=3;
Kara Sea=4; Laptev Sea=4; East Siberian Sea=4; Chukchi Sea=4; Greenland Sea=4; White Sea=4; Ligurian Sea=4; Balearic Sea=4; Alboran Sea=4; Salton Sea=4; Weddell Sea=4; Ross Sea=4; Java Sea=4;
Banda Sea=4; Celebes Sea/Sulawesi Sea=4; Sulu Sea=4; Timor Sea=4; Arafura Sea=4; Solomon Sea=4; Bismarck Sea=4; Wadden Sea=4; Seto Inland Sea/Inland Sea=4; Bohai Sea/Bohai=4; Gulf of Riga=4;
Gulf of Sidra/Gulf of Sirte=4; Gulf of Suez=4; Spencer Gulf=4; Gulf of Lion/Gulf of Lions=4; Gulf of Genoa=4; Gulf of Corinth=4; Gulf of Panama=4; Gulf of Honduras=4; Gulf of Paria=4;
Gulf of Venezuela=4; Gulf of Kutch/Gulf of Kachchh=4; Gulf of Mannar=4; Gulf of Taranto=4; Gulf of Cadiz=4; Saronic Gulf=4; Bay of Plenty=4; Bay of Islands=4; Port Phillip Bay/Port Phillip=4;
Moreton Bay=4; Shark Bay=4; Jervis Bay=4; Osaka Bay=4; Manila Bay=4; Bay of Kotor/Boka Kotorska=4; Dublin Bay=4; Bantry Bay=4; Cardigan Bay=4; Morecambe Bay=4; Swansea Bay=4; Delaware Bay=4;
Massachusetts Bay=4; Narragansett Bay=4; Biscayne Bay=4; Mobile Bay=4; Galveston Bay=4; Guanabara Bay=4; Table Bay=4; False Bay=4; James Bay=4; Bristol Bay=4; Prudhoe Bay=4; Montego Bay=4;
Georgian Bay=4; Thunder Bay=4; Green Bay=4; Half Moon Bay=4; Santa Monica Bay=4; San Diego Bay=4; Bay of Campeche=4; Milford Sound=4; Hervey Bay=4; Hanauma Bay=4; Glacier Bay=4;
Prince William Sound=4; Moray Firth=4; Firth of Forth=4; Firth of Clyde=4; Solway Firth=4; Wash=4; Great Australian Bight=4; Kattegat=4;
Levantine Sea=5; Libyan Sea=5; Sea of Crete/Cretan Sea=5; Amundsen Sea=5; Bellingshausen Sea=5; Scotia Sea=5; Laccadive Sea=5; Molucca Sea=5; Flores Sea=5; Bali Sea=5; Savu Sea=5; Halmahera Sea=5;
Seram Sea/Ceram Sea=5; Bothnian Sea=5; Sea of the Hebrides=5; Irminger Sea=5; Lincoln Sea=5; Wandel Sea=5; Pechora Sea=5; Davis Sea=5; Mawson Sea=5; Cooperation Sea=5; Riiser-Larsen Sea=5;
Lazarev Sea=5; Somov Sea=5; Dumont d'Urville Sea=5; Thracian Sea=5; Myrtoan Sea=5; Icarian Sea=5; Argentine Sea=5; Sea of Chiloe=5; Natuna Sea=5; Gulf of Khambhat/Gulf of Cambay=5; Gulf of Trieste=5;
Gulf of Saint Vincent/Gulf St Vincent=5; Gulf of Gdansk=5; Gulf of Ob=5; Gulf of Anadyr=5; Gulf of Papua=5; Gulf of Tehuantepec=5; Gulf of Fonseca=5; Gulf of Darien=5; Gulf of Uraba=5;
Gulf of Guayaquil=5; Gulf of San Jorge=5; Gulf of Valencia=5; Thermaic Gulf=5; Gulf of Izmir=5; Gulf of Antalya=5; Gulf of Iskenderun=5; Gulf of Gabes=5; Gulf of Tunis=5; Gulf of Hammamet=5;
Gulf of Salerno=5; Gulf of Gaeta=5; Gulf of Kotor=5; Gulf of Martaban=5; Gulf of Boothia=5; Gulf of Batabano=5; Gulf of Bahrain=5; Gulf of Tadjoura=5; Gulf of Chiriqui=5; Gulf of Nicoya=5;
Gulf of Morbihan=5; Dingle Bay=5; Liverpool Bay=5; Robin Hood's Bay=5; Walvis Bay=5; Algoa Bay=5; Ungava Bay=5; Bay of All Saints/Todos os Santos Bay=5; Kiel Bay=5; Bay of Gdansk=5; Cambridge Bay=5;
Bay of Quinte=5; Saginaw Bay=5; Grand Traverse Bay=5; Humboldt Bay=5; Tomales Bay=5; Morro Bay=5; Bay of Banderas/Banderas Bay=5; Acapulco Bay=5; Jamaica Bay=5; Raritan Bay=5; Buzzards Bay=5;
Casco Bay=5; Penobscot Bay=5; Passamaquoddy Bay=5; Frobisher Bay=5; Repulse Bay=5; Cam Ranh Bay=5; Nha Trang Bay=5; Bay of Seine=5; Bay of Mont-Saint-Michel=5; Bay of Somme=5; Bay of Cadiz=5;
Bay of Palma=5; Bay of Pollensa=5; Bay of Gibraltar/Algeciras Bay=5; Bay of Sevastopol=5; Hawke Bay=5; Tasman Bay=5; Golden Bay=5; Doubtful Sound=5; Twofold Bay=5; Encounter Bay=5; Geographe Bay=5;
Kealakekua Bay=5; Maunalua Bay=5; Kaneohe Bay=5; Resurrection Bay=5; Kachemak Bay=5; Cook Inlet=5; Pamlico Sound=5; Albemarle Sound=5; Bight of Benin=5; Bight of Biafra/Bight of Bonny=5;
Southern Bight=5; German Bight=5; Bight of Bangkok=5` },

{ id: 'geo-volcano', cat: 'Geography', q: 'Name a volcano', a: `
Vesuvius/Mount Vesuvius=1; Etna/Mount Etna=1; Mount St Helens/Mount Saint Helens/St Helens=1; Mount Fuji/Fuji/Fujiyama=1; Krakatoa/Krakatau=1; Kilauea=1;
Mauna Loa=2; Mauna Kea=2; Stromboli=2; Eyjafjallajokull=2; Pinatubo/Mount Pinatubo=2; Popocatepetl/Popo=2; Tambora/Mount Tambora=2; Yellowstone/Yellowstone Caldera/Yellowstone Supervolcano=2;
Mount Pelee/Pelee/Montagne Pelee=2; Kilimanjaro/Mount Kilimanjaro=2; Hekla=2; Mount Rainier/Rainier=2; Cotopaxi=2;
Mount Hood=3; Mount Shasta=3; Mount Baker=3; Lassen Peak/Mount Lassen=3; Mount Erebus/Erebus=3; Mount Ararat/Ararat=3; Mount Elbrus/Elbrus=3; Teide/Mount Teide=3; Mayon/Mount Mayon=3;
Merapi/Mount Merapi=3; Agung/Mount Agung=3; Bromo/Mount Bromo=3; Taal=3; Sakurajima=3; Nyiragongo/Mount Nyiragongo=3; Ruapehu/Mount Ruapehu=3; Whakaari/White Island=3; Chimborazo=3; Paricutin=3;
Fuego/Volcan de Fuego=3; Arenal=3; Haleakala=3; Diamond Head=3; Campi Flegrei/Phlegraean Fields=3; Santorini/Thera=3; Toba/Lake Toba=3; Anak Krakatau=3; Hunga Tonga/Hunga Tonga-Hunga Ha'apai=3;
Olympus Mons=3;
Mount Mazama/Crater Lake=4; Rinjani/Mount Rinjani=4; Sinabung=4; Semeru=4; Mount Aso/Aso=4; Unzen/Mount Unzen=4; Ontake/Mount Ontake=4; Ol Doinyo Lengai=4; Mount Cameroon=4; Erta Ale=4;
Mount Kenya=4; Tongariro/Mount Tongariro=4; Ngauruhoe/Mount Ngauruhoe=4; Taranaki/Mount Taranaki/Mount Egmont=4; Rangitoto=4; Taupo/Lake Taupo=4; Tungurahua=4; Villarrica=4; Osorno=4;
Ojos del Salado=4; Nevado del Ruiz=4; El Misti/Misti=4; Colima/Volcan de Colima=4; Iztaccihuatl=4; Pico de Orizaba/Orizaba/Citlaltepetl=4; Pacaya=4; Poas=4; Irazu=4; Masaya=4; Soufriere Hills=4;
La Soufriere=4; Katmai/Mount Katmai=4; Novarupta=4; Mount Adams=4; Sunset Crater=4; Hualalai=4; Surtsey=4; Katla=4; Laki=4; Grimsvotn=4; Bardarbunga=4; Fagradalsfjall=4; Vulcano=4;
Piton de la Fournaise=4; Klyuchevskaya Sopka=4; Damavand/Mount Damavand=4; Batur/Mount Batur=4; Ijen=4; Paektu/Baekdu/Changbai=4; Yasur/Mount Yasur=4; Arthur's Seat=4; Puy de Dome=4; El Chichon=4;
Quilotoa=4; Mount Meru=4; Longonot=4; Mount Elgon=4;
Kelud=5; Nyamuragira=5; Tarawera/Mount Tarawera=5; Sangay=5; Pichincha/Guagua Pichincha=5; Llaima=5; Calbuco=5; Chaiten=5; Galeras=5; Sabancaya=5; Ubinas=5; Licancabur=5; Parinacota=5; Momotombo=5;
Redoubt/Mount Redoubt=5; Augustine=5; Mount Spurr=5; Pavlof=5; Shishaldin=5; Mount Edgecumbe=5; Mount Garibaldi=5; Mount Meager=5; Newberry=5; Three Sisters=5; Mount Jefferson=5; Glacier Peak=5;
Long Valley Caldera=5; Kamaehuakanaloa/Loihi=5; Askja=5; Krafla=5; Snaefellsjokull=5; Nisyros=5; Pico/Mount Pico=5; Fogo=5; Karthala=5; Bezymianny=5; Shiveluch=5; Avachinsky=5; Tolbachik=5; Kazbek=5;
Mount Hasan=5; Nemrut=5; Mount Apo=5; Kanlaon=5; Bulusan=5; Kerinci=5; Tangkuban Perahu=5; Hallasan=5; Asama/Mount Asama=5; Bandai=5; Nishinoshima=5; Ambrym=5; Rabaul=5; Lamington=5;
Deception Island=5; Mount Sidley=5; Big Ben=5; Laacher See=5; Eldfell=5; Kirishima=5; Mount Usu/Usu=5; Tokachi=5; Mount Mihara/Mihara=5; Miyakejima=5; Mount Tarumae=5; Soputan=5; Lokon=5;
Karangetang=5; Dukono=5; Manam=5; Ulawun=5; Kavachi=5; Monowai=5; Axial Seamount=5; Kick 'em Jenny=5; Mount Liamuiga=5; Nevis Peak=5; Mount Scenery=5; Tacana=5; Santa Maria/Santa Maria Volcano=5;
Atitlan=5; San Pedro=5; Concepcion=5; Telica=5; San Cristobal=5; Turrialba=5; Rincon de la Vieja=5; Baru=5; Purace=5; Reventador=5; Antisana=5; Cayambe=5; Coropuna=5; Lascar=5; Lanin=5; Copahue=5;
Puyehue=5; Hudson=5; Tronador=5; Craters of the Moon=5; Mount Tabor=5; Shiprock=5; Capulin=5; Valles Caldera=5; Mount Taylor=5; San Francisco Mountain=5; Mount Wrangell=5; Mount Veniaminof=5;
Okmok=5; Cleveland/Mount Cleveland=5; Aniakchak=5; Kasatochi=5; Mount Edziza=5; Mount Terror=5; Mount Melbourne=5; Mount Takahe=5; Mount Michael=5; Menengai=5; Suswa=5; Emi Koussi=5; Jebel Marra=5;
Dabbahu=5; Nabro=5; Fantale=5; Mount Karisimbi=5; Mount Bisoke=5; Sabyinyo=5; Mount Muhabura=5; Mount Mikeno=5` },

{ id: 'geo-national-park', cat: 'Geography', q: 'Name a US national park', a: `
Yellowstone=1; Yosemite=1; Grand Canyon=1;
Zion=2; Glacier=2; Great Smoky Mountains/Smoky Mountains/Smokies/Great Smokies=2; Rocky Mountain/Rocky Mountains/Rockies=2; Everglades=2; Acadia=2; Arches=2; Bryce Canyon/Bryce=2; Joshua Tree=2;
Grand Teton/Tetons/Teton=2; Death Valley=2; Olympic=2; Sequoia=2; Mount Rainier/Rainier=2;
Denali=3; Badlands=3; Redwood/Redwoods=3; Shenandoah=3; Canyonlands=3; Capitol Reef=3; Mesa Verde=3; Crater Lake=3; Big Bend=3; Carlsbad Caverns=3; Hawaii Volcanoes/Hawaii Volcanoes National Park=3;
Haleakala=3; Mammoth Cave=3; Saguaro=3; Petrified Forest=3; White Sands=3; Kings Canyon=3; Glacier Bay=3;
Biscayne=4; Dry Tortugas=4; Hot Springs=4; Wind Cave=4; Cuyahoga Valley/Cuyahoga=4; Great Sand Dunes=4; Black Canyon of the Gunnison/Black Canyon=4; Channel Islands=4; Pinnacles=4;
Lassen Volcanic/Lassen=4; North Cascades=4; Katmai=4; Kenai Fjords=4; Isle Royale=4; Theodore Roosevelt=4; Indiana Dunes=4; New River Gorge=4; Gateway Arch=4; Great Basin=4; Guadalupe Mountains=4;
Virgin Islands=4; Voyageurs=4; Congaree=4; Wrangell-St Elias/Wrangell-Saint Elias/Wrangell=4;
American Samoa/National Park of American Samoa=5; Gates of the Arctic=5; Kobuk Valley=5; Lake Clark=5` },

{ id: 'geo-waterfall', cat: 'Geography', q: 'Name a waterfall', a: `
Niagara Falls/Niagara=1; Victoria Falls/Mosi-oa-Tunya=1; Angel Falls/Kerepakupai Meru/Salto Angel=1; Iguazu Falls/Iguacu Falls/Iguazu/Iguassu Falls=1;
Yosemite Falls=2; Horseshoe Falls=2; Bridalveil Fall/Bridal Veil Falls/Bridal Veil=2; Multnomah Falls=2; Gullfoss=2; Skogafoss=2;
Seljalandsfoss=3; Dettifoss=3; American Falls=3; Rhine Falls=3; Kaieteur Falls/Kaieteur=3; Tugela Falls=3; Reichenbach Falls=3; Havasu Falls=3; Lower Yellowstone Falls/Yellowstone Falls=3;
Snoqualmie Falls=3; Godafoss=3;
Sutherland Falls=4; Plitvice Falls/Plitvice=4; Shoshone Falls=4; Svartifoss=4; Gocta Falls/Gocta=4; Jog Falls=4; Dudhsagar Falls=4; Huangguoshu Falls=4;
Detian Falls/Ban Gioc Falls/Ban Gioc-Detian Falls=4; Erawan Falls=4; Kuang Si Falls=4; Staubbach Falls=4; Krimml Falls=4; Seven Sisters/De Syv Sostrene=4; Voringsfossen=4; Powerscourt Waterfall=4;
Aira Force=4; High Force=4; Nevada Fall=4; Vernal Fall=4; Palouse Falls=4; McWay Falls=4; Akaka Falls=4; Wailua Falls=4; Rainbow Falls=4; Cumberland Falls=4; Ruby Falls=4; Minnehaha Falls=4;
Great Falls=4; Montmorency Falls=4; Takakkaw Falls=4; Blue Nile Falls/Tis Abay=4; Murchison Falls=4; Ouzoud Falls=4; Augrabies Falls=4; Wentworth Falls=4; Jim Jim Falls=4; Twin Falls=4; Huka Falls=4;
Khone Falls/Khone Phapheng=4; Marmore Falls/Cascata delle Marmore=4; Nohkalikai Falls=4; Giessbach Falls=4; Glymur=4; Kirkjufellsfoss=4;
Athirappilly Falls=5; Hogenakkal Falls=5; Kegon Falls=5; Nachi Falls=5; Krka/Skradinski Buk=5; Trummelbach Falls=5; Gavarnie Falls=5; Vettisfossen=5; Langfoss=5; Kjosfossen=5; Hraunfossar=5;
Aldeyjarfoss=5; Haifoss=5; Torc Waterfall=5; Hardraw Force=5; Swallow Falls=5; Henrhyd Falls=5; Pistyll Rhaeadr=5; Steall Falls=5; Falls of Foyers=5; Eas a' Chual Aluinn=5; Falls of Clyde=5;
Mooney Falls=5; Ribbon Fall=5; Burney Falls=5; Taughannock Falls=5; Kaaterskill Falls=5; Amicalola Falls=5; Tahquamenon Falls=5; Fall Creek Falls=5; Della Falls=5; Virginia Falls=5; Kakabeka Falls=5;
Helmcken Falls=5; Basaseachic Falls=5; Agua Azul=5; Hierve el Agua=5; Kalambo Falls=5; Howick Falls=5; Mac Mac Falls=5; Wallaman Falls=5; Stirling Falls=5; Browne Falls=5; Mitchell Falls=5;
Ebor Falls=5; Fitzroy Falls=5; Boyoma Falls/Stanley Falls=5; Inga Falls=5; Guaira Falls/Sete Quedas=5; Ramnefjellsfossen=5; Olo'upena Falls=5; Yumbilla Falls=5; Tad Lo=5; Pongour Falls=5;
Elephant Falls=5; Kutralam/Courtallam Falls=5; Shivanasamudra Falls=5; Bhagsu Falls=5; Thi Lo Su=5; Pailon del Diablo=5; Salto del Laja=5; Salto Grande=5; Salto Mocona/Mocona Falls=5;
Cascada de Tamul/Tamul=5; Cascate del Mulino/Saturnia=5; Cascata del Toce=5; Cascade d'Ars=5; Cascades du Herisson=5; Gollinger Wasserfall=5; Triberg Falls/Triberg Waterfalls=5; Todtnau Falls=5;
Bad Urach Falls=5; Mardalsfossen=5; Steinsdalsfossen=5; Latefossen=5; Tvindefossen=5; Skjervsfossen=5; Hengifoss=5; Bruarfoss=5; Barnafoss=5; Oxararfoss=5; Hjalparfoss=5; Faxi=5; Gljufrabui=5;
Litlanesfoss=5; Rjukandi=5; Manawaiopuna Falls/Jurassic Park Falls=5; Hanakapiai Falls=5; Waimoku Falls=5; Silver Strand Falls=5; Tower Fall=5; Gibbon Falls=5; Kepler Cascades=5; Fairy Falls=5;
Mesa Falls=5; Spokane Falls=5; Willamette Falls=5; Wahclella Falls=5; Latourell Falls=5; Proxy Falls=5; Toketee Falls=5; Watson Falls=5; Salt Creek Falls=5; Sol Duc Falls=5; Marymere Falls=5;
Comet Falls=5; Myrtle Falls=5; Christine Falls=5; Narada Falls=5; Calf Creek Falls=5; Seven Falls=5; Rifle Falls=5; Fish Creek Falls=5; Zapata Falls=5; Grotto Falls=5; Laurel Falls=5; Abrams Falls=5;
Linville Falls=5; Looking Glass Falls=5; Whitewater Falls=5; Dry Falls=5; Toccoa Falls=5; Anna Ruby Falls=5; Tallulah Falls=5; Bushkill Falls=5; Cohoes Falls=5; Ithaca Falls=5; Buttermilk Falls=5;
Kent Falls=5; Arethusa Falls=5; Moss Glen Falls=5; Bash Bish Falls=5; Glen Onoko=5; Cucumber Falls=5; Ohiopyle Falls=5; Brandywine Falls=5; Blackwater Falls=5; Sandstone Falls=5; Crabtree Falls=5;
Gooseberry Falls=5; High Falls=5; Willow River Falls=5; Bond Falls=5; Munising Falls=5; Miners Falls=5; Turner Falls=5; Gorman Falls=5; Pedernales Falls=5; McKinney Falls=5; Cedar Falls=5;
Hemmed-In Hollow Falls=5` }
);
