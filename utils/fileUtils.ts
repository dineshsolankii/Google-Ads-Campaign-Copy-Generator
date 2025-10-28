
import { AdGroup } from '../types';

// Declaration for PapaParse which is loaded from a CDN
declare var Papa: any;
// Declaration for SheetJS (xlsx) which is loaded from a CDN
declare var XLSX: any;

export const parseKeywordsFromFile = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result;
        if (!fileContent) {
          reject(new Error('File is empty.'));
          return;
        }

        let keywords: string[] = [];

        if (file.name.endsWith('.csv')) {
          const result = Papa.parse(fileContent as string, {
            header: false,
            skipEmptyLines: true,
          });
          keywords = result.data.flat().map((k: any) => String(k).trim()).filter(Boolean);
        } else if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(fileContent, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          keywords = json.flat().map((k: any) => String(k).trim()).filter(Boolean);
        } else {
          reject(new Error('Unsupported file type. Please upload a CSV or XLSX file.'));
          return;
        }
        resolve(keywords);
      } catch (err) {
        reject(new Error('Error parsing file.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }

  });
};


export const exportToXLSX = (adGroups: AdGroup[]): void => {
    const wb = XLSX.utils.book_new();
    const ws_data: any[][] = [
        ["Ad Group", "Keywords", "Headline", "Headline Length", "Description", "Description Length"]
    ];

    const merges: any[] = [];
    let currentRow = 1;

    adGroups.forEach((group, groupIndex) => {
        const rowCount = Math.max(group.headlines.length, group.descriptions.length);
        
        if (rowCount > 1) {
            merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + rowCount - 1, c: 0 } }); // Merge Ad Group cells
            merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + rowCount - 1, c: 1 } }); // Merge Keywords cells
        }

        for(let i = 0; i < rowCount; i++) {
            const row: any[] = [];
            if (i === 0) {
                row.push(group.name);
                row.push(group.keywords.join('\n'));
            } else {
                row.push(null);
                row.push(null);
            }

            const headline = group.headlines[i]?.text || '';
            const description = group.descriptions[i]?.text || '';
            row.push(headline);
            row.push(headline.length);
            row.push(description);
            row.push(description.length);

            ws_data.push(row);
        }
        currentRow += rowCount;
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!merges'] = merges;

    // Apply some styling and formatting
    const wsCols = [
        { wch: 30 }, // Ad Group
        { wch: 40 }, // Keywords
        { wch: 40 }, // Headline
        { wch: 15 }, // Headline Length
        { wch: 60 }, // Description
        { wch: 18 }  // Description Length
    ];
    ws['!cols'] = wsCols;

    // Center align length columns and wrap text for others
    for (let R = 0; R < ws_data.length; ++R) {
        for (let C = 0; C < ws_data[R].length; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (ws[cell_ref]) {
                 ws[cell_ref].s = { 
                     alignment: { 
                        wrapText: true, 
                        vertical: 'top',
                        horizontal: (C === 3 || C === 5) ? 'center' : 'left'
                     }
                };
            }
        }
    }


    XLSX.utils.book_append_sheet(wb, ws, "Ad Campaign");
    XLSX.writeFile(wb, "Google-Ads-Campaign.xlsx");
};
