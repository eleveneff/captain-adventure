import json
E=[]  # events
def ev(era,year,title,fact,why): E.append(dict(era=era,year=year,title=title,fact=fact,whyItMatters=why))

eras=[
 dict(id="e1",name="Explorers and First Peoples",startYear=1500,endYear=1606,summary="Millions of Native people already lived across North America when Spanish, French and English explorers arrived. The newcomers brought horses and new goods, but also diseases like smallpox that killed huge numbers of Native people."),
 dict(id="e2",name="Thirteen Colonies Take Root",startYear=1607,endYear=1753,summary="English colonists built settlements along the Atlantic coast and began to govern themselves with elected assemblies. At the same time, enslaved Africans were forced to work in the colonies, and Native nations lost land in wars and treaties."),
 dict(id="e3",name="Revolution and a New Nation",startYear=1754,endYear=1789,summary="Colonists protested British taxes, declared independence in 1776 and won the Revolutionary War. They then wrote the Constitution, creating a government run by the people."),
 dict(id="e4",name="A Growing Nation",startYear=1790,endYear=1849,summary="The United States added the Bill of Rights, doubled in size and pushed west. Growth brought canals and new freedoms for many, but it also spread slavery and forced Native nations off their homelands."),
 dict(id="e5",name="Civil War and Reconstruction",startYear=1850,endYear=1877,summary="Arguments over slavery split the nation, and the Civil War began in 1861. The Union won, slavery was ended by the 13th Amendment, and new amendments promised citizenship and voting rights to formerly enslaved people."),
 dict(id="e6",name="Inventions, Immigrants and Reform",startYear=1878,endYear=1928,summary="Millions of immigrants arrived, and inventors and factories changed daily life. Reformers fought for women's right to vote, while Black Americans faced Jim Crow laws and Native peoples lost more land."),
 dict(id="e7",name="Hard Times and World War II",startYear=1929,endYear=1945,summary="The Great Depression left millions without jobs until the New Deal and the war effort brought work back. Americans then helped win World War II, though Japanese Americans were unfairly forced into camps at home."),
 dict(id="e8",name="Civil Rights, Space and Modern America",startYear=1946,endYear=2026,summary="Black Americans and their allies used courts, marches and votes to end legal segregation. Americans also walked on the Moon, built new technology and kept working to live up to the nation's founding ideals."),
]

# e1
ev("e1",1513,"Ponce de León reaches Florida","Spanish explorer Juan Ponce de León landed on the coast of Florida in 1513 and named it La Florida.","It was the first known European landing on what is now the US mainland.")
ev("e1",1524,"Verrazzano sails the Atlantic coast","Giovanni da Verrazzano, an Italian sailing for France, explored the Atlantic coast and sailed into New York Harbor in 1524.","Europeans began to map the eastern coast of North America.")
ev("e1",1534,"Cartier explores for France","Jacques Cartier sailed into the Gulf of St. Lawrence in 1534 and claimed land for France.","It began France's claims in North America, which later stretched down to Louisiana.")
ev("e1",1540,"Coronado searches the Southwest","Francisco Vázquez de Coronado led an army from Mexico into the American Southwest in 1540, searching for cities of gold that did not exist.","His trip reached as far as present-day Kansas and showed how big the continent was.")
ev("e1",1541,"De Soto reaches the Mississippi","Hernando de Soto's Spanish expedition crossed the Southeast and reached the Mississippi River in 1541.","His soldiers attacked many Native towns, and the diseases they carried spread to Native peoples.")
ev("e1",1565,"St. Augustine is founded","Pedro Menéndez de Avilés founded St. Augustine, Florida, in 1565.","It is the oldest continuously lived-in city founded by Europeans in the United States.")
ev("e1",1587,"The Lost Colony of Roanoke","English colonists settled on Roanoke Island in 1587, and Virginia Dare became the first English child born in the Americas.","When supply ships returned in 1590 the colonists were gone, and their fate is still a mystery.")
ev("e1",1598,"Oñate leads settlers into New Mexico","Juan de Oñate led Spanish settlers north into New Mexico in 1598.","Spain's colony there was harsh toward the Pueblo people, who later rose up against Spanish rule.")
# e2
ev("e2",1607,"Jamestown is founded","English colonists founded Jamestown, Virginia, in 1607.","It was the first permanent English settlement in North America.")
ev("e2",1610,"Santa Fe is founded","Spanish settlers founded Santa Fe, New Mexico, around 1610.","It is the oldest state capital city in the United States.")
ev("e2",1619,"First elected assembly meets","Virginia's House of Burgesses met in 1619 as the first elected lawmaking assembly in English America.","It planted the idea of self-government that grew into American democracy.")
ev("e2",1619,"Enslaved Africans arrive in Virginia","In 1619 a ship brought about 20 captive Africans to Virginia, the first Africans recorded in the English colony.","Slavery grew in the colonies after this and lasted until 1865.")
ev("e2",1620,"The Mayflower Compact","Before landing at Plymouth in 1620, the Pilgrims signed the Mayflower Compact, agreeing to make fair laws and obey them.","It was an early example of people agreeing to govern themselves.")
ev("e2",1636,"Roger Williams founds Providence","Roger Williams founded Providence in 1636 as a place where people could worship freely.","It helped make religious freedom an American value.")
ev("e2",1675,"King Philip's War","In 1675 the Wampanoag leader Metacom, called King Philip by the English, led Native nations in a war against New England colonists who were taking their land.","It was one of the deadliest wars in colonial America, and Native nations in New England lost much of their land.")
ev("e2",1680,"The Pueblo Revolt","In 1680 the Pueblo people, led by Popé, drove Spanish colonists out of New Mexico.","The Pueblo people ruled themselves for 12 years before Spain returned.")
ev("e2",1681,"William Penn's colony","King Charles II granted William Penn the colony of Pennsylvania in 1681.","Penn welcomed people of many faiths, and Philadelphia became a leading city.")
ev("e2",1739,"The Stono Rebellion","In 1739 enslaved people near the Stono River in South Carolina rose up and marched toward freedom in Spanish Florida.","It was the largest uprising of enslaved people in Britain's mainland colonies and showed that enslaved people resisted slavery.")
# e3
ev("e3",1754,"French and Indian War begins","In 1754 fighting broke out between Britain and France, each with Native allies, over land in the Ohio River Valley.","Britain won in 1763 but needed money afterward, so it began taxing the colonists.")
ev("e3",1765,"The Stamp Act","Britain's Stamp Act of 1765 taxed printed papers in the colonies, such as newspapers and legal documents.","Colonists protested 'no taxation without representation' because they had no vote in Parliament.")
ev("e3",1773,"The Boston Tea Party","In December 1773 colonists in Boston dumped 342 chests of British tea into the harbor to protest a tax on tea.","Britain punished Boston with harsh laws, pushing the colonies toward war.")
ev("e3",1775,"Lexington and Concord","On April 19, 1775, colonial militia fought British soldiers at Lexington and Concord in Massachusetts.","These were the first battles of the American Revolution.")
ev("e3",1776,"The Declaration of Independence","On July 4, 1776, the Continental Congress approved the Declaration of Independence, written mostly by Thomas Jefferson.","It declared that all men are created equal with rights to life, liberty and the pursuit of happiness.")
ev("e3",1777,"Victory at Saratoga","The Americans defeated a British army at Saratoga, New York, in 1777.","The win convinced France to join the war on the American side in 1778.")
ev("e3",1781,"Victory at Yorktown","In 1781 British General Cornwallis surrendered to American and French forces at Yorktown, Virginia.","It was the last major battle of the Revolutionary War.")
ev("e3",1783,"Treaty of Paris","In the Treaty of Paris of 1783, Britain recognized the United States as an independent nation.","The new nation's land stretched west to the Mississippi River.")
ev("e3",1787,"The Constitution is written","Delegates signed the US Constitution in Philadelphia on September 17, 1787.","It created a government with three branches and checks and balances, and it is still in use today.")
ev("e3",1789,"Washington becomes president","George Washington took the oath as the first president of the United States in New York City in 1789.","He set examples, like stepping down after two terms, that later presidents followed.")
# e4
ev("e4",1791,"Bill of Rights ratified","The first ten amendments to the Constitution, called the Bill of Rights, were ratified in 1791.","They protect freedoms such as speech, religion, the press and fair trials.")
ev("e4",1793,"The cotton gin","Eli Whitney invented the cotton gin in 1793, a machine that quickly pulled seeds out of cotton.","Cotton became very profitable, and sadly slavery grew much larger in the South.")
ev("e4",1803,"The Louisiana Purchase","In 1803 the United States bought the Louisiana Territory from France for $15 million.","It roughly doubled the size of the country.")
ev("e4",1804,"Lewis and Clark set out","Meriwether Lewis and William Clark set out in 1804 to explore the West, helped later by a Shoshone woman named Sacagawea.","They reached the Pacific Ocean in 1805 and brought back maps and knowledge of the West.")
ev("e4",1814,"The Star-Spangled Banner","During the War of 1812, Francis Scott Key watched the flag still flying over Fort McHenry in 1814 and wrote the poem that became the national anthem.","The song became a symbol of American courage and pride.")
ev("e4",1825,"The Erie Canal opens","The Erie Canal opened in 1825, connecting the Great Lakes to the Hudson River and New York City.","It made shipping goods much cheaper and helped the country grow.")
ev("e4",1830,"Indian Removal Act and Trail of Tears","The Indian Removal Act of 1830 led to forced removals, including the Cherokee Trail of Tears in 1838-1839, when about 4,000 Cherokee people died.","It is one of the saddest chapters in American history and a broken promise to Native nations.")
ev("e4",1836,"The Alamo and Texas independence","After the fall of the Alamo in 1836, Texans won independence from Mexico at the Battle of San Jacinto.","Texas became its own republic and joined the United States in 1845.")
ev("e4",1848,"The Seneca Falls Convention","In 1848 women and men met at Seneca Falls, New York, and declared that all men and women are created equal.","It started the organized movement for women's rights, including the right to vote.")
ev("e4",1848,"War with Mexico ends and gold is found","In 1848 the Mexican-American War ended with the US gaining California and much of the Southwest, and gold was found in California that same year.","The Gold Rush of 1849 brought people from around the world to California.")
# e5
ev("e5",1850,"Compromise of 1850","The Compromise of 1850 let California join as a free state but added a tough Fugitive Slave Act.","The law forced Northerners to help return people who escaped slavery, which angered many in the North.")
ev("e5",1857,"The Dred Scott decision","In 1857 the Supreme Court ruled in the Dred Scott case that Black Americans could not be citizens.","The ruling was deeply unjust and pushed the nation closer to war.")
ev("e5",1861,"The Civil War begins","The Civil War began on April 12, 1861, when Confederate forces fired on Fort Sumter in South Carolina.","Southern states had left the Union mainly to protect slavery.")
ev("e5",1863,"The Emancipation Proclamation","On January 1, 1863, President Lincoln's Emancipation Proclamation declared enslaved people in Confederate areas free.","It made ending slavery a goal of the war and let Black men join the Union army.")
ev("e5",1863,"Gettysburg","The Union won the Battle of Gettysburg in July 1863, and Lincoln gave the Gettysburg Address there that November.","Lincoln said the war was for a 'new birth of freedom' and government 'of the people, by the people, for the people.'")
ev("e5",1865,"The war ends","General Robert E. Lee surrendered to General Ulysses S. Grant at Appomattox Court House, Virginia, on April 9, 1865.","The Union was saved, but just days later Lincoln was assassinated.")
ev("e5",1865,"The 13th Amendment","The 13th Amendment, ratified in December 1865, ended slavery in the United States.","About 4 million people who had been enslaved were now free.")
ev("e5",1868,"The 14th Amendment","The 14th Amendment, ratified in 1868, made everyone born in the US a citizen and promised equal protection of the laws.","It later became the basis for many civil rights victories.")
ev("e5",1869,"Transcontinental railroad","The first transcontinental railroad was completed at Promontory Summit, Utah, on May 10, 1869.","A trip across the country dropped from months to about a week; Chinese and Irish immigrants did much of the hard building work.")
ev("e5",1877,"Reconstruction ends","In 1877 the last federal troops left the South, ending Reconstruction.","Without protection, Black Southerners lost many rights to new Jim Crow laws.")
# e6
ev("e6",1882,"Chinese Exclusion Act","The Chinese Exclusion Act of 1882 banned most Chinese workers from coming to the United States.","It was the first major law to keep out a group based on nationality and was not repealed until 1943.")
ev("e6",1886,"Statue of Liberty dedicated","The Statue of Liberty, a gift from the people of France, was dedicated in New York Harbor in 1886.","It became a welcome sign of freedom for immigrants arriving by ship.")
ev("e6",1890,"Wounded Knee","In December 1890 US soldiers killed more than 250 Lakota men, women and children at Wounded Knee in South Dakota.","It marked the tragic end of the wars on the Great Plains.")
ev("e6",1892,"Ellis Island opens","Ellis Island opened in New York Harbor in 1892 to welcome and check new immigrants.","About 12 million immigrants passed through it before it closed in 1954.")
ev("e6",1896,"Plessy v. Ferguson","In 1896 the Supreme Court ruled in Plessy v. Ferguson that 'separate but equal' segregation was allowed.","It let Jim Crow segregation spread until the ruling was overturned in 1954.")
ev("e6",1903,"First airplane flight","On December 17, 1903, Orville and Wilbur Wright made the first powered airplane flights near Kitty Hawk, North Carolina.","It began the age of flight.")
ev("e6",1908,"The Model T","Henry Ford introduced the Model T car in 1908, and his moving assembly line, started in 1913, made it cheap enough for many families.","Cars changed how and where Americans lived and worked.")
ev("e6",1917,"America enters World War I","The United States entered World War I in April 1917.","American troops helped the Allies win the war in 1918.")
ev("e6",1920,"Women win the vote","The 19th Amendment, ratified in 1920, gave women the right to vote.","It was a huge step toward the promise that all are created equal.")
ev("e6",1924,"Indian Citizenship Act","The Indian Citizenship Act of 1924 made all Native Americans born in the US citizens.","Some states still blocked Native people from voting for years afterward.")
# e7
ev("e7",1929,"The stock market crash","The stock market crashed in October 1929, helping start the Great Depression.","At its worst, about one in four American workers had no job.")
ev("e7",1933,"The New Deal begins","President Franklin D. Roosevelt took office in 1933 and began the New Deal, programs to create jobs and help people.","It changed what Americans expected the federal government to do.")
ev("e7",1935,"The Dust Bowl and Social Security","In 1935 giant dust storms swept the Great Plains, and Congress passed the Social Security Act.","Many Dust Bowl families moved west to find work, and Social Security still helps older Americans today.")
ev("e7",1941,"Pearl Harbor","Japan attacked the US naval base at Pearl Harbor, Hawaii, on December 7, 1941.","The next day the United States entered World War II.")
ev("e7",1942,"Japanese American incarceration","In 1942 an order by President Roosevelt forced about 120,000 people of Japanese ancestry on the West Coast into camps, most of them US citizens.","In 1988 the US government formally apologized and paid survivors.")
ev("e7",1942,"Navajo Code Talkers","Starting in 1942, Navajo Marines used their language as a secret code the enemy never broke.","Their skill helped win battles in the Pacific, such as Iwo Jima.")
ev("e7",1944,"D-Day","On June 6, 1944, American, British and Canadian troops landed on the beaches of Normandy, France.","It began the push that freed Western Europe from Nazi Germany.")
ev("e7",1945,"World War II ends","Germany surrendered in May 1945, and Japan surrendered after the US dropped two atomic bombs, ending the war in September 1945.","The United States came out of the war as a world leader.")
# e8
ev("e8",1947,"Jackie Robinson breaks the color line","Jackie Robinson played his first game for the Brooklyn Dodgers on April 15, 1947.","He became the first Black player in modern Major League Baseball.")
ev("e8",1954,"Brown v. Board of Education","In 1954 the Supreme Court ruled in Brown v. Board of Education that segregated public schools were unconstitutional.","It overturned 'separate but equal' and gave the civil rights movement a big legal win.")
ev("e8",1955,"The Montgomery bus boycott","After Rosa Parks was arrested on December 1, 1955, for not giving up her bus seat, Black residents of Montgomery, Alabama, boycotted the buses for 381 days.","The boycott ended bus segregation there and made Martin Luther King Jr. a national leader.")
ev("e8",1959,"Alaska and Hawaii join","Alaska and Hawaii became the 49th and 50th states in 1959.","The flag got its 50 stars in 1960.")
ev("e8",1963,"March on Washington","On August 28, 1963, about 250,000 people marched in Washington, D.C., where Martin Luther King Jr. gave his 'I Have a Dream' speech.","It pushed Congress to pass new civil rights laws.")
ev("e8",1964,"Civil Rights Act and Voting Rights Act","The Civil Rights Act of 1964 banned segregation in public places, and the Voting Rights Act of 1965 protected Black Americans' right to vote.","Together they ended legal Jim Crow and helped America live up to its ideals.")
ev("e8",1969,"Apollo 11 lands on the Moon","On July 20, 1969, American astronauts Neil Armstrong and Buzz Aldrin became the first people to walk on the Moon.","It showed what American science and teamwork could do.")
ev("e8",2001,"September 11 attacks","On September 11, 2001, terrorists hijacked four planes and killed nearly 3,000 people in New York, at the Pentagon and in Pennsylvania.","Americans came together, and the attacks changed how the country protects itself.")
ev("e8",2008,"First Black president elected","In 2008 Barack Obama was elected the first African American president.","It showed how far the nation had come since the days of slavery and Jim Crow.")
ev("e8",2026,"America turns 250","July 4, 2026, marked 250 years since the Declaration of Independence.","It was a time to remember the founding ideals that Americans still work to live up to.")

for era in eras:
    n=1
    for e in E:
        if e["era"]==era["id"]:
            e["id"]=f"{era['id']}-ev{n:02d}"; n+=1
events=[{k:e[k] for k in ["id","era","year","title","fact","whyItMatters"]} for e in E]

P=[
("Pocahontas","c. 1596–1617","e2","A Powhatan girl who helped keep peace between her people and the Jamestown colonists, she later married colonist John Rolfe and traveled to England."),
("Squanto (Tisquantum)","c. 1585–1622","e2","A Patuxet man who had been kidnapped to Europe and learned English, he taught the Plymouth Pilgrims how to plant corn and helped them talk with the Wampanoag."),
("Popé","died c. 1688","e2","A Pueblo religious leader, he led the 1680 Pueblo Revolt that drove Spanish rulers out of New Mexico for 12 years."),
("William Penn","1644–1718","e2","A Quaker, he founded Pennsylvania as a colony with religious freedom and made treaties with the Lenape people."),
("Benjamin Franklin","1706–1790","e3","A printer, scientist and inventor, he helped write the Declaration of Independence, won France's help in the Revolution and helped write the Constitution."),
("George Washington","1732–1799","e3","He led the Continental Army to victory in the Revolution and became the first president, stepping down after two terms."),
("Thomas Jefferson","1743–1826","e3","He wrote most of the Declaration of Independence and, as the third president, made the Louisiana Purchase, though he also enslaved hundreds of people."),
("Phillis Wheatley","c. 1753–1784","e3","Kidnapped from West Africa and enslaved in Boston, she published a book of poems in 1773, the first by an African American woman."),
("James Madison","1751–1836","e3","Called the Father of the Constitution, he planned much of it and wrote the Bill of Rights, then became the fourth president."),
("Sacagawea","c. 1788–1812","e4","A Shoshone woman, she guided and translated for Lewis and Clark while carrying her baby son."),
("Sequoyah","c. 1770–1843","e4","A Cherokee silversmith, he created a writing system for the Cherokee language in 1821, and soon thousands of Cherokee could read and write."),
("Elizabeth Cady Stanton","1815–1902","e4","She helped organize the 1848 Seneca Falls Convention and wrote its Declaration of Sentiments for women's rights."),
("Frederick Douglass","1818–1895","e5","He escaped slavery, became a famous speaker and writer against slavery, and urged Lincoln to let Black soldiers fight."),
("Harriet Tubman","c. 1822–1913","e5","She escaped slavery and returned to lead about 70 people to freedom on the Underground Railroad, then served as a Union scout and spy."),
("Abraham Lincoln","1809–1865","e5","The 16th president, he led the Union through the Civil War, issued the Emancipation Proclamation and pushed for the 13th Amendment."),
("Chief Joseph","1840–1904","e5","A Nez Perce leader, he led his people on a 1,000-mile retreat in 1877 before surrendering with the words 'I will fight no more forever.'"),
("Susan B. Anthony","1820–1906","e6","She spent more than 50 years fighting for women's right to vote; the 19th Amendment is sometimes called the Susan B. Anthony Amendment."),
("Thomas Edison","1847–1931","e6","An inventor with more than 1,000 patents, he created a practical light bulb and the phonograph."),
("Andrew Carnegie","1835–1919","e6","A poor immigrant from Scotland, he built a giant steel company and gave much of his fortune to build more than 2,500 public libraries."),
("Ida B. Wells","1862–1931","e6","A Black journalist, she bravely reported on lynching and helped start the NAACP."),
("Wilbur and Orville Wright","1867–1912 and 1871–1948","e6","Brothers who ran a bicycle shop in Dayton, Ohio, they built and flew the first powered airplane in 1903."),
("Theodore Roosevelt","1858–1919","e6","As the 26th president, he protected about 230 million acres of public land, including national forests and parks."),
("Franklin D. Roosevelt","1882–1945","e7","The only president elected four times, he led the country through the Great Depression with the New Deal and through most of World War II."),
("Jackie Robinson","1919–1972","e8","In 1947 he became the first Black player in modern Major League Baseball, facing insults with courage and skill."),
("Rosa Parks","1913–2005","e8","Her arrest for refusing to give up her bus seat in 1955 sparked the Montgomery bus boycott."),
("Martin Luther King Jr.","1929–1968","e8","A minister who led the civil rights movement with peaceful protest, he gave the 'I Have a Dream' speech and won the Nobel Peace Prize in 1964."),
("Neil Armstrong","1930–2012","e8","Born in Ohio, he became the first person to walk on the Moon in 1969."),
]
people=[dict(name=a,years=b,era=c,whatTheyDid=d) for a,b,c,d in P]

Q=[]
def mc(era,year,fact,q,choices,ans,expl): Q.append(dict(type="mc",era=era,year=year,fact=fact,question=q,choices=choices,answerIndex=ans,explanation=expl))
mc("e1",1492,"In 1492 Christopher Columbus sailed west from Spain and reached islands in the Caribbean.","Which country paid for Christopher Columbus's 1492 voyage?",["England","Portugal","Spain","Italy"],2,"Columbus was born in Genoa, in today's Italy, but Queen Isabella and King Ferdinand of Spain paid for his trip. He landed in the Bahamas on October 12, 1492, and the meeting of Europe and the Americas changed both forever.")
mc("e1",1513,"Juan Ponce de León landed in Florida in 1513.","Which explorer named Florida?",["Juan Ponce de León","Christopher Columbus","Hernando de Soto","Jacques Cartier"],0,"Ponce de León landed in 1513 and named it La Florida. De Soto came through Florida later, in 1539.")
mc("e1",1565,"St. Augustine, Florida, was founded in 1565.","What is the oldest continuously lived-in city founded by Europeans in the United States?",["Jamestown","Plymouth","Boston","St. Augustine"],3,"St. Augustine was founded by the Spanish in 1565, 42 years before Jamestown.")
mc("e1",1587,"The Roanoke colonists had vanished by the time supply ships returned in 1590.","Why is Roanoke called the 'Lost Colony'?",["It was hidden on a secret map","Its colonists disappeared, and no one knows for sure what happened","It sank into the ocean","It was moved to Canada"],1,"When John White returned in 1590 he found only the word CROATOAN carved on a post. The colonists' fate is still a mystery.")
mc("e1",1540,"Diseases brought by Europeans killed huge numbers of Native people in the 1500s and after.","What was the biggest cause of death for Native peoples after Europeans arrived?",["Battles with explorers","Earthquakes","Diseases like smallpox","Lack of horses"],2,"Native peoples had never been exposed to smallpox and measles, so these diseases killed huge numbers of them, more than wars did.")
mc("e2",1607,"Jamestown, founded in 1607, was the first permanent English settlement in North America.","What was the first permanent English settlement in North America?",["Plymouth","Jamestown","Roanoke","Boston"],1,"Jamestown, Virginia, was founded in 1607. Roanoke failed, and Plymouth came later, in 1620.")
mc("e2",1619,"The House of Burgesses, first meeting in 1619, was the first elected assembly in English America.","What was special about Virginia's House of Burgesses?",["It was the first elected lawmaking assembly in English America","It was the king's palace","It was the first school in America","It was a fort against the Spanish"],0,"Colonists elected its members, an early step toward self-government in America.")
mc("e2",1620,"The Pilgrims signed the Mayflower Compact in 1620.","What did the Mayflower Compact do?",["It declared independence from England","It set up a fair trade deal with France","It said the settlers would make and obey fair laws together","It ended slavery in Massachusetts"],2,"The Pilgrims agreed to govern themselves by laws made for the good of the colony, an early example of self-government.")
mc("e2",1680,"Popé led the Pueblo Revolt in 1680.","What happened in the Pueblo Revolt of 1680?",["The Pueblo people drove the Spanish out of New Mexico","The Pilgrims fought the Wampanoag","The French captured Florida","The Pueblo people sold their land to England"],0,"The Pueblo people pushed the Spanish out of New Mexico and governed themselves for 12 years.")
mc("e2",1739,"The Stono Rebellion took place in South Carolina in 1739.","The Stono Rebellion of 1739 was an uprising by whom?",["Colonists against British taxes","Enslaved people seeking freedom","French soldiers","Pilgrims against the king"],1,"Enslaved people in South Carolina rose up and marched toward Spanish Florida, where they hoped to be free. It shows that enslaved people resisted slavery.")
mc("e3",1765,"The Stamp Act of 1765 taxed printed papers in the colonies.","What did colonists mean by 'no taxation without representation'?",["They wanted no taxes at all, ever","They did not want to be taxed by a Parliament where they had no vote","They wanted France to pay their taxes","They wanted to tax British soldiers"],1,"Colonists had no elected members in Parliament, so they said Parliament had no right to tax them.")
mc("e3",1773,"Colonists dumped British tea into Boston Harbor in December 1773.","Why did colonists hold the Boston Tea Party?",["To celebrate a holiday","To protest a British tax on tea","Because the tea was spoiled","To welcome new ships"],1,"They dumped 342 chests of tea to protest a tax passed without their consent.")
mc("e3",1775,"The first battles of the Revolution were fought at Lexington and Concord on April 19, 1775.","Where were the first battles of the American Revolution fought?",["Yorktown and Saratoga","Lexington and Concord","Philadelphia and New York","Gettysburg and Antietam"],1,"Fighting began at Lexington and Concord, Massachusetts. Yorktown was near the end, and Gettysburg was in the Civil War.")
mc("e3",1776,"Congress approved the Declaration of Independence on July 4, 1776.","Who wrote most of the Declaration of Independence?",["George Washington","Benjamin Franklin","Thomas Jefferson","John Hancock"],2,"Thomas Jefferson wrote the first draft. Franklin and John Adams helped edit it, and John Hancock signed it first and largest.")
mc("e3",1776,"The Declaration says all men are created equal with rights to life, liberty and the pursuit of happiness.","Which rights does the Declaration of Independence name?",["Life, liberty and the pursuit of happiness","Speech, press and religion","Food, shelter and clothing","Voting, jury and travel"],0,"The Declaration names life, liberty and the pursuit of happiness. Speech, press and religion are protected by the First Amendment in the Bill of Rights.")
mc("e3",1777,"The American victory at Saratoga came in 1777.","Why was the Battle of Saratoga a turning point?",["It ended the war","It convinced France to join the American side","It was the first battle of the war","George Washington was captured"],1,"After Saratoga, France signed an alliance with the United States in 1778 and sent soldiers, ships and money.")
mc("e3",1787,"The Constitution was signed in Philadelphia on September 17, 1787.","The Constitution splits the government into how many branches?",["Two","Three","Four","Five"],1,"There are three branches, legislative, executive and judicial, and checks and balances keep any one from becoming too powerful.")
mc("e4",1791,"The Bill of Rights was ratified in 1791.","What is the Bill of Rights?",["The first ten amendments to the Constitution","A list of taxes","The peace treaty with Britain","The Declaration of Independence"],0,"The Bill of Rights is the first ten amendments, protecting freedoms like speech, religion and a fair trial.")
mc("e4",1803,"The US bought the Louisiana Territory from France in 1803.","From which country did the United States buy the Louisiana Territory?",["Spain","Britain","France","Mexico"],2,"Napoleon of France sold it for $15 million, roughly doubling the size of the country.")
mc("e4",1805,"Sacagawea helped the Lewis and Clark expedition, which reached the Pacific in 1805.","How did Sacagawea help Lewis and Clark?",["She drew the map of the Louisiana Purchase","She translated and helped guide them","She was their ship captain","She sold them horses in St. Louis"],1,"A Shoshone woman, she translated, helped them get horses from her people and showed that the group came in peace.")
mc("e4",1838,"About 4,000 Cherokee people died as a result of their forced removal in 1838-1839.","What was the Trail of Tears?",["A trail for gold miners","The forced removal of the Cherokee from their homeland to Indian Territory","A trail used by Lewis and Clark","An escape route on the Underground Railroad"],1,"After the Indian Removal Act of 1830, the US Army forced the Cherokee west to present-day Oklahoma, and thousands died along the way.")
mc("e4",1848,"The Seneca Falls Convention for women's rights met in 1848.","What was the Seneca Falls Convention about?",["Women's rights","Building canals","The Gold Rush","Ending the War of 1812"],0,"Its Declaration of Sentiments said 'all men and women are created equal' and asked for women's right to vote.")
mc("e5",1850,"Harriet Tubman led about 70 people to freedom on the Underground Railroad.","What was the Underground Railroad?",["A subway under New York","A secret network of people helping enslaved people escape to freedom","The first railroad across the country","A Confederate supply line"],1,"It was not a real railroad. It was a network of routes and safe houses, and 'conductors' like Harriet Tubman guided people north.")
mc("e5",1861,"The Civil War began at Fort Sumter on April 12, 1861.","What was the main cause of the Civil War?",["Taxes on tea","Slavery and whether it would spread","A war with Mexico","Who would own Alaska"],1,"Southern states left the Union mainly to protect slavery, and the North would not let the nation be split.")
mc("e5",1863,"Lincoln issued the Emancipation Proclamation on January 1, 1863.","What did the Emancipation Proclamation do?",["Ended the Civil War","Declared enslaved people in Confederate areas free","Gave women the right to vote","Made Lincoln president"],1,"It freed enslaved people in areas fighting against the Union. Slavery everywhere ended with the 13th Amendment in 1865.")
mc("e5",1865,"The 13th Amendment was ratified in December 1865.","Which amendment ended slavery in the United States?",["1st Amendment","13th Amendment","15th Amendment","19th Amendment"],1,"The 13th Amendment ended slavery. The 15th protected Black men's right to vote, and the 19th gave women the vote.")
mc("e5",1869,"The transcontinental railroad was completed at Promontory Summit, Utah, in 1869.","Which immigrant groups did much of the work building the transcontinental railroad?",["Chinese and Irish workers","German and Italian workers","Spanish and French workers","Swedish and Polish workers"],0,"Chinese workers built much of the Central Pacific line through the mountains, and many Irish workers built the Union Pacific.")
mc("e6",1886,"The Statue of Liberty was dedicated in 1886.","Which country gave the Statue of Liberty to the United States?",["England","Spain","France","Italy"],2,"The people of France gave the statue as a gift of friendship, honoring the two nations' shared love of liberty.")
mc("e6",1892,"Ellis Island opened in 1892.","What was Ellis Island?",["A Civil War fort","An immigration station in New York Harbor","A gold mine in California","A navy base in Hawaii"],1,"About 12 million immigrants were checked in at Ellis Island between 1892 and 1954.")
mc("e6",1896,"Plessy v. Ferguson in 1896 allowed 'separate but equal' segregation.","What were Jim Crow laws?",["Laws that protected voting rights","Laws in many states, mostly in the South, that forced Black and white people apart","Laws that ended slavery","Laws about building railroads"],1,"Jim Crow laws segregated schools, trains and more, and kept many Black citizens from voting. Brown v. Board (1954) and laws in 1964 and 1965 ended legal Jim Crow.")
mc("e6",1903,"The Wright brothers made the first powered airplane flights in 1903.","Where did the Wright brothers make the first airplane flight?",["Dayton, Ohio","Near Kitty Hawk, North Carolina","St. Louis, Missouri","New York City"],1,"They built their plane in Dayton, Ohio, but flew it near Kitty Hawk, North Carolina, where strong, steady winds helped.")
mc("e6",1920,"The 19th Amendment was ratified in 1920.","What did the 19th Amendment do?",["Ended slavery","Gave women the right to vote","Created the income tax","Made Native Americans citizens"],1,"After more than 70 years of struggle since Seneca Falls, women won the vote in 1920.")
mc("e7",1929,"The stock market crash of 1929 helped start the Great Depression.","What was the Great Depression?",["A time when many people lost jobs and money","A war with Britain","A big storm in Florida","A time of great inventions"],0,"After the 1929 crash, businesses and banks failed, and about one in four workers had no job at the worst point.")
mc("e7",1933,"Franklin D. Roosevelt began the New Deal in 1933.","Which president started the New Deal?",["Theodore Roosevelt","Franklin D. Roosevelt","Abraham Lincoln","Herbert Hoover"],1,"Franklin D. Roosevelt started the New Deal. Theodore Roosevelt, his distant cousin, was president earlier, from 1901 to 1909.")
mc("e7",1941,"Japan attacked Pearl Harbor on December 7, 1941.","What event brought the United States into World War II?",["The sinking of the Titanic","The attack on Pearl Harbor","D-Day","The stock market crash"],1,"Japan's surprise attack on Pearl Harbor, Hawaii, led Congress to declare war the next day.")
mc("e7",1942,"About 120,000 people of Japanese ancestry were forced into camps starting in 1942.","Why is the forced removal of Japanese Americans in World War II seen as wrong today?",["They were paid too much","They were jailed without trials, mostly US citizens, only because of their ancestry","They were sent to fight in Europe","They chose to move"],1,"Most had done nothing wrong and were US citizens. In 1988 Congress apologized and paid survivors.")
mc("e8",1954,"The Supreme Court decided Brown v. Board of Education in 1954.","What did the Brown v. Board of Education decision say?",["Schools could stay segregated","Segregated public schools were unconstitutional","Women could vote","Only some states needed public schools"],1,"The Court said separate schools for Black and white children were not equal, overturning Plessy v. Ferguson.")
mc("e8",1955,"Rosa Parks was arrested in Montgomery, Alabama, on December 1, 1955.","What did Rosa Parks refuse to do?",["Pay her taxes","Give up her bus seat to a white passenger","Go to school","Sign a petition"],1,"Her arrest sparked the 381-day Montgomery bus boycott, which ended bus segregation in the city.")
mc("e8",1963,"Martin Luther King Jr. gave his 'I Have a Dream' speech on August 28, 1963.","Where did Martin Luther King Jr. give his 'I Have a Dream' speech?",["Montgomery, Alabama","Atlanta, Georgia","At the Lincoln Memorial in Washington, D.C.","Independence Hall in Philadelphia"],2,"He spoke at the Lincoln Memorial during the March on Washington, calling on America to live up to the promise that all men are created equal.")
mc("e8",1965,"The Voting Rights Act was passed in 1965.","What did the Voting Rights Act of 1965 do?",["Gave women the vote","Protected Black Americans' right to vote by banning unfair tests","Lowered the voting age to 18","Created the Electoral College"],1,"It banned literacy tests and other tricks used to keep Black citizens from voting. The voting age was lowered to 18 later, in 1971.")
mc("e8",1969,"Apollo 11 landed on the Moon on July 20, 1969.","Who was the first person to walk on the Moon?",["Buzz Aldrin","John Glenn","Neil Armstrong","Alan Shepard"],2,"Neil Armstrong stepped out first, and Buzz Aldrin followed. John Glenn was the first American to orbit Earth, in 1962.")

for i,q in enumerate(Q):
    q["id"]=f"q{i:02d}"
    t=(i*3+2)%4  # spread answer positions evenly
    a=q["answerIndex"]
    if a!=t and not q["choices"][0].isalpha() or True:
        c=q["choices"]; c[a],c[t]=c[t],c[a]; q["answerIndex"]=t
    if q["choices"]==["Three","Two","Four","Five"] or set(q["choices"])=={"Two","Three","Four","Five"}:
        q["choices"]=["Two","Three","Four","Five"]; q["answerIndex"]=1
mcq=[{k:q[k] for k in ["id","type","era","year","fact","question","choices","answerIndex","explanation"]} for q in Q]

O=[
("e1",[("Columbus reaches the Caribbean",1492),("St. Augustine is founded",1565),("Roanoke colony settled",1587)],"Columbus sailed in 1492, the Spanish founded St. Augustine in 1565, and the English tried Roanoke in 1587."),
("e2",[("Jamestown founded",1607),("Mayflower Compact signed",1620),("Pennsylvania granted to William Penn",1681)],"Jamestown (1607) came before Plymouth's Mayflower Compact (1620), and Penn's colony came much later (1681)."),
("e3",[("Boston Tea Party",1773),("Declaration of Independence",1776),("Constitution signed",1787)],"Protest came first (1773), then independence (1776), then a new plan of government (1787)."),
("e3",[("Lexington and Concord",1775),("Battle of Saratoga",1777),("Surrender at Yorktown",1781)],"The war began in 1775, turned at Saratoga in 1777 and ended in victory at Yorktown in 1781."),
("e4",[("Bill of Rights ratified",1791),("Louisiana Purchase",1803),("Seneca Falls Convention",1848)],"The Bill of Rights (1791) came first, then the Louisiana Purchase (1803), then Seneca Falls (1848)."),
("e5",[("Dred Scott decision",1857),("Emancipation Proclamation",1863),("13th Amendment ratified",1865)],"The unjust Dred Scott ruling (1857) came before the Emancipation Proclamation (1863), and slavery finally ended with the 13th Amendment (1865)."),
("e6",[("Statue of Liberty dedicated",1886),("Wright brothers' first flight",1903),("19th Amendment ratified",1920)],"The statue was dedicated in 1886, the first flight came in 1903 and women won the vote in 1920."),
("e8",[("Brown v. Board of Education",1954),("March on Washington",1963),("Apollo 11 Moon landing",1969)],"Brown v. Board was in 1954, the March on Washington in 1963 and the Moon landing in 1969."),
]
import random
random.seed(7)
orders=[]
for i,(era,evs,expl) in enumerate(O):
    shown=evs[:]
    while shown==evs: random.shuffle(shown)
    correct=[shown.index(e) for e in sorted(evs,key=lambda x:x[1])]
    orders.append(dict(id=f"q{len(mcq)+i:02d}",type="order",era=era,events=[dict(title=t,year=y) for t,y in shown],correctOrder=correct,explanation=expl))

landmarks=[
dict(name="Statue of Liberty",location="New York Harbor, New York",story="The people of France gave the Statue of Liberty to the United States, and it was dedicated in 1886. Broken chains lie at her feet, and a plaque inside holds Emma Lazarus's poem welcoming the 'huddled masses yearning to breathe free.' For millions of immigrants arriving by ship, she was their first sight of America."),
dict(name="Mount Rushmore",location="Black Hills, South Dakota",story="Sculptor Gutzon Borglum and about 400 workers carved the faces of Washington, Jefferson, Theodore Roosevelt and Lincoln into the mountain between 1927 and 1941. Each face is about 60 feet tall. The Black Hills are sacred to the Lakota, and the US took them in the 1870s despite an 1868 treaty, which the Supreme Court later ruled was wrong."),
dict(name="Golden Gate Bridge",location="San Francisco, California",story="The Golden Gate Bridge opened in 1937 across the windy, foggy entrance to San Francisco Bay. Its 4,200-foot main span was the longest of any suspension bridge in the world at the time. Its famous color is called International Orange."),
dict(name="The Alamo",location="San Antonio, Texas",story="The Alamo was an old Spanish mission where Texan defenders, including Davy Crockett and Jim Bowie, held out against the Mexican army for 13 days in 1836 before nearly all were killed. Weeks later Texans shouted 'Remember the Alamo!' as they won independence at San Jacinto. One cause of the conflict was that many American settlers held enslaved people, and Mexico had moved to end slavery."),
dict(name="Liberty Bell",location="Philadelphia, Pennsylvania",story="The Liberty Bell hung in the Pennsylvania State House, now called Independence Hall, and it is inscribed 'Proclaim LIBERTY throughout all the Land unto all the Inhabitants thereof.' In the 1830s, people working to end slavery named it the Liberty Bell and made it their symbol. A famous crack stopped it from ringing by the 1840s."),
dict(name="Gateway Arch",location="St. Louis, Missouri",story="The Gateway Arch, finished in 1965, is 630 feet tall and 630 feet wide, making it the tallest monument in the United States. It honors St. Louis as the 'Gateway to the West,' near where Lewis and Clark began their journey in 1804. Visitors can ride a small tram to the top."),
]

S=[
("Alabama","The Montgomery bus boycott of 1955-1956 helped end segregation on the city's buses."),
("Alaska","The United States bought Alaska from Russia in 1867 for $7.2 million, and it became the 49th state in 1959."),
("Arizona","Arizona became the 48th state on February 14, 1912, the last of the lower 48 states to join."),
("Arkansas","In 1957 nine Black students, the Little Rock Nine, needed soldiers to protect them as they integrated Central High School."),
("California","Gold found at Sutter's Mill in 1848 started the Gold Rush, and California became a state in 1850."),
("Colorado","Colorado joined in 1876, 100 years after the Declaration of Independence, so it is called the Centennial State."),
("Connecticut","Connecticut's Fundamental Orders of 1639 were one of the first written plans of government in America, which is why it is called the Constitution State."),
("Delaware","Delaware was the first state to ratify the Constitution, on December 7, 1787."),
("Florida","St. Augustine, founded by the Spanish in 1565, is the oldest continuously lived-in European-founded city in the US."),
("Georgia","Georgia, founded by James Oglethorpe in 1733, was the last of the thirteen colonies."),
("Hawaii","Japan's attack on Pearl Harbor on December 7, 1941, brought the United States into World War II."),
("Idaho","Lewis and Clark crossed Idaho's rugged Bitterroot Mountains in 1805 on their way to the Pacific."),
("Illinois","Abraham Lincoln built his law career in Springfield, which is why Illinois calls itself the Land of Lincoln."),
("Indiana","Abraham Lincoln grew up on a farm in southern Indiana from age 7 to age 21."),
("Iowa","Herbert Hoover, born in West Branch in 1874, was the first president born west of the Mississippi River."),
("Kansas","The Brown v. Board of Education case that ended school segregation in 1954 began in Topeka."),
("Kentucky","Abraham Lincoln was born in a log cabin in Kentucky on February 12, 1809."),
("Louisiana","Andrew Jackson's army won the Battle of New Orleans in January 1815, the last major battle of the War of 1812."),
("Maine","Maine was part of Massachusetts until it became a separate state in 1820."),
("Maryland","Francis Scott Key wrote 'The Star-Spangled Banner' after watching the British attack Fort McHenry in Baltimore in 1814."),
("Massachusetts","The first battles of the American Revolution were fought at Lexington and Concord on April 19, 1775."),
("Michigan","Henry Ford started his moving assembly line at Highland Park, Michigan, in 1913, making cars affordable for many families."),
("Minnesota","Minnesota was the first state to offer volunteer soldiers to President Lincoln when the Civil War began in 1861."),
("Mississippi","During Freedom Summer in 1964, volunteers came to Mississippi to help Black citizens register to vote."),
("Missouri","Lewis and Clark set off up the Missouri River from near St. Louis in 1804."),
("Montana","At the Battle of the Little Bighorn in 1876, Lakota, Cheyenne and Arapaho warriors defeated George Custer's soldiers."),
("Nebraska","Daniel Freeman made one of the first claims under the Homestead Act near Beatrice on January 1, 1863."),
("Nevada","Nevada joined the Union in 1864 during the Civil War, which is why its motto is 'Battle Born.'"),
("New Hampshire","In January 1776 New Hampshire became the first colony to adopt its own constitution, separate from British rule."),
("New Jersey","George Washington crossed the icy Delaware River on December 25-26, 1776, and surprised enemy troops at Trenton."),
("New Mexico","Santa Fe, founded around 1610, is the oldest state capital in the United States."),
("New York","George Washington was sworn in as the first president at Federal Hall in New York City in 1789."),
("North Carolina","The Wright brothers made the first powered airplane flights near Kitty Hawk on December 17, 1903."),
("North Dakota","Lewis and Clark spent the winter of 1804-1805 at Fort Mandan, where they met Sacagawea."),
("Ohio","Neil Armstrong, the first person to walk on the Moon, was born in Wapakoneta, Ohio."),
("Oklahoma","The Trail of Tears ended in Indian Territory, which is now Oklahoma, after the Cherokee were forced west in 1838-1839."),
("Oregon","The Oregon Trail, about 2,000 miles long, carried hundreds of thousands of settlers west to places like Oregon's Willamette Valley."),
("Pennsylvania","Both the Declaration of Independence and the Constitution were signed at Independence Hall in Philadelphia."),
("Rhode Island","Roger Williams founded Providence in 1636 as a place of religious freedom."),
("South Carolina","The Civil War began when Confederate forces fired on Fort Sumter in Charleston Harbor on April 12, 1861."),
("South Dakota","Mount Rushmore, carved from 1927 to 1941, shows four presidents in the Black Hills."),
("Tennessee","In 1920 Tennessee became the 36th state to ratify the 19th Amendment, the final vote needed to give women the right to vote."),
("Texas","Texas was an independent country, the Republic of Texas, from 1836 until it joined the US in 1845."),
("Utah","The first transcontinental railroad was completed at Promontory Summit, Utah, on May 10, 1869."),
("Vermont","Vermont's 1777 constitution was the first in America to ban slavery for adults."),
("Virginia","Jamestown, the first permanent English settlement, was founded in 1607, and the Revolution's last big battle was at Yorktown in 1781."),
("Washington","Washington is the only state named after a president."),
("West Virginia","West Virginia split from Virginia during the Civil War and became a state in 1863."),
("Wisconsin","In 1932 Wisconsin passed the first state unemployment insurance law in the country."),
("Wyoming","In 1869 Wyoming Territory became the first place in the United States to give women the right to vote."),
]
states=[dict(state=a,fact=b) for a,b in S]

meta=dict(
 title="Liberty Isle US History Pack",
 version="1.0.0",
 date="2026-11-22",
 for_="Captain Adventure: Liberty Isle side quest (Princess Prep Content Bot)",
 audience="ISEE Lower Level student, age 11-12; written at a 5th-6th grade reading level",
 rules=[
  "Nothing before 1500, except the opening question q00 about Columbus's 1492 voyage.",
  "Focus mainly on North America and the lands that became the United States, not Central/South America or Europe.",
  "Facts first, with an American exceptionalism focus: the founding ideals, the Declaration, the Constitution and Bill of Rights, self-government, opportunity and innovation, immigrants, and ending slavery and extending civil rights as America living up to its ideals.",
  "Every fact must be accurate.",
  "Hard history is included and told honestly and age-appropriately: slavery, the treatment of Native peoples, Jim Crow.",
 ],
 sources=[
  "National Archives, America's Founding Documents: https://www.archives.gov/founding-docs",
  "National Park Service (Jamestown, St. Augustine/Castillo de San Marcos, Independence Hall, Trail of Tears, Statue of Liberty, Mount Rushmore, Gateway Arch, Golden Gate): https://www.nps.gov",
  "NPS, Trail of Tears deaths: https://www.nps.gov/articles/000/what-happened-on-the-trail-of-tears.htm",
  "NPS, Theodore Roosevelt and Conservation: https://www.nps.gov/thro/learn/historyculture/theodore-roosevelt-and-conservation.htm",
  "Library of Congress, Primary Documents in American History: https://guides.loc.gov/primary-documents-in-american-history",
  "Smithsonian National Museum of American History: https://americanhistory.si.edu",
  "US Senate and House history offices (amendments and ratification dates): https://history.house.gov",
 ],
)
meta["for"]=meta.pop("for_")
pack=dict(meta=meta,eras=eras,events=events,people=people,questions=mcq+orders,landmarks=landmarks,states=states)
json.dump(pack,open("/workspace/shared/liberty-isle/history-pack.json","w"),ensure_ascii=False,indent=2)
