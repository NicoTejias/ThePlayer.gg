import { describe, it, expect } from 'vitest';
import { parseMeleeCSV } from './CSVParser';

describe('CSVParser - parseMeleeCSV', () => {
    const mockHeader = 'Rank,Points,MatchRecord,TeamPlayers1Name,TeamPlayers1FirstName,TeamPlayers1LastName';
    const mockRow = '1,22,7-1-1,Patricio Roman,Patricio,Roman';
    const csvContent = `${mockHeader}\n${mockRow}`;

    it('should correctly parse a valid Melee CSV row', () => {
        const { results } = parseMeleeCSV(csvContent);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
            rank: 1,
            name: 'Patricio Roman',
            points: 22,
            wins: 7,
            losses: 1,
            draws: 1
        });
    });

    it('should handle "LastName, FirstName" format in TeamPlayers1Name', () => {
        const specialNameHeader = 'Rank,Points,MatchRecord,TeamPlayers1Name';
        const specialNameRow = '2,20,6-1-2,"Torrico, Carlos"';
        const specialCsv = `${specialNameHeader}\n${specialNameRow}`;

        const { results } = parseMeleeCSV(specialCsv);
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Carlos Torrico');
    });

    it('should throw an error if required columns are missing', () => {
        const invalidHeader = 'SomeOtherColumn,AnotherOne';
        const invalidCsv = `${invalidHeader}\n1,2,3`;

        expect(() => parseMeleeCSV(invalidCsv)).toThrow('CSV no tiene la columna "Rank"');
    });

    it('should skip invalid rows and log warnings', () => {
        const mixedCsv = `${mockHeader}\n1,22,7-1-1,Patricio Roman\nInvalid,Row,Data,Here\n2,20,6-1-2,Carlos Torrico`;
        const { results } = parseMeleeCSV(mixedCsv);

        // It should find 2 valid rows
        expect(results).toHaveLength(2);
        expect(results[0].name).toBe('Patricio Roman');
        expect(results[1].name).toBe('Carlos Torrico');
    });

    it('should calculate points if missing but MatchRecord exists', () => {
        const noPointsHeader = 'Rank,MatchRecord,TeamPlayers1Name';
        const noPointsRow = '1,3-0-0,Winner Guy'; // 3 wins = 9 points
        const noPointsCsv = `${noPointsHeader}\n${noPointsRow}`;

        const { results } = parseMeleeCSV(noPointsCsv);
        expect(results[0].points).toBe(9);
    });

    it('should extract date if present in columns', () => {
        const dateHeader = 'Rank,Points,MatchRecord,TeamPlayers1Name,Date';
        const dateRow = '1,9,3-0-0,Winner Guy,2023-12-25';
        const dateCsv = `${dateHeader}\n${dateRow}`;

        const { detectedDate } = parseMeleeCSV(dateCsv);
        expect(detectedDate).toBe('2023-12-25');
    });

    it('should sanitize team tags in brackets and parentheses', () => {
        const header = 'Rank,MatchRecord,TeamPlayers1Name';
        const row = '1,3-0-0,[CL] Nicolás Tejías (CL)';
        const csv = `${header}\n${row}`;

        const { results } = parseMeleeCSV(csv);
        expect(results[0].name).toBe('Nicolás Tejías');
    });

    it('should sanitize sponsor pipe prefixes and pronouns', () => {
        const header = 'Rank,MatchRecord,TeamPlayers1Name';
        const row = '1,3-0-0,"Liquid | Carlos Torrico He/Him"';
        const csv = `${header}\n${row}`;

        const { results } = parseMeleeCSV(csv);
        expect(results[0].name).toBe('Carlos Torrico');
    });

    it('should enforce points consistency based on wins and draws', () => {
        const header = 'Rank,Points,MatchRecord,TeamPlayers1Name';
        const row = '1,12,3-0-1,Winner Guy'; // 3 wins (9 pts) + 1 draw (1 pt) = 10 pts. CSV says 12.
        const csv = `${header}\n${row}`;

        const { results } = parseMeleeCSV(csv);
        expect(results[0].points).toBe(10); // Should force consistency to 10
    });
});
