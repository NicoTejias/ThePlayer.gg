const { parseEventLinkText } = require('./utils/TextParser.ts');

const sampleText = `Puesto	Nombre	Puntos	V/D/E	%VPO	%JG	%JGO	
1	rodrigo guzman	7	2/0/1	59.3%	62.5%	65.9%	 
2	Ignacio Matias Yañez Pasquet	7	2/0/1	48.1%	83.3%	43.1%	 
3	Franco Biggio (Naivak) 🐸	6	2/1/0	59.3%	71.4%	57.3%	 
4	Diego Jofre	6	2/1/0	44.4%	66.7%	46.0%	 
5	Juan Nacho Zuñiga	3	1/2/0	59.3%	42.9%	55.8%	 
6	cristian muñoz	3	1/2/0	59.3%	33.3%	61.1%	 
7	Camilo Munizaga	3	1/2/0	59.3%	33.3%	61.1%	 
8	El moise s	0	0/3/0	33.3%	33.3%	36.5%`;

const result = parseEventLinkText(sampleText);
console.log(JSON.stringify(result, null, 2));
