// d3-dsv
import { csvParse } from 'd3-dsv'
// entity
import { AreaType, Data, OECDStatus } from './types/entity'

export default async function loadCsv(): Promise<Data[]> {
    try {
        const strings = await fetch('https://raw.githubusercontent.com/judoaseeta/csvs/main/energymix4.csv')
        const parsedStrings = await strings.text()
        const data = csvParse(parsedStrings)
        return data.map((d) => ({
            coal: parseFloat(d['Coal Consumption - TWh (zero filled)'] || '0'),
            gas: parseFloat(d['Gas Consumption - TWh (zero filled)'] || '0'),
            biofuels: parseFloat(d['Biofuels Consumption - TWh - Total (zero filled)'] || '0'),
            biomass: parseFloat(d['Geo Biomass Other - TWh (zero filled)'] || '0'),
            hydro: parseFloat(d['Hydro Consumption - TWh (zero filled)'] || '0'),
            nuclear: parseFloat(d['Nuclear Consumption - TWh (zero filled)'] || '0'),
            solar: parseFloat(d['Solar Consumption - TWh (zero filled)'] || '0'),
            oil: parseFloat(d['Oil Consumption - TWh (zero filled)'] || '0'),
            wind: parseFloat(d['Wind Consumption - TWh (zero filled)'] || '0'),
            code: d['Code'] || '',
            entity: d['Entity'] || '',
            year: d['Year'] || '',
            oecdStatus: (d['isOECD'] as OECDStatus) || 'Non-OECD',
            region: d['Region'] || '',
            type: (d['type'] as AreaType) || '',
        }))
    } catch (err) {
        throw err
    }
}
