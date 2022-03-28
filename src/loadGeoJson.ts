// d3-dsv

import { feature } from 'topojson'
import { CountryGeoJsons, GeoJsons, RegionGeoJsons } from './types/entity'

export default async function loadGeoJSON(): Promise<GeoJsons> {
    try {
        const countriesGeojson = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        const landsGeojson = await fetch(
            'https://gist.githubusercontent.com/judoaseeta/27ab78bd9fda1f1c748c0df2a04b3af4/raw/1dfae143bd65edb7bf332e6b4b5f9f76d1bceba4/map.geojson',
        )
        const countriesData = await countriesGeojson.json()
        const regions = (await landsGeojson.json()) as unknown as RegionGeoJsons

        const countries = feature(countriesData, countriesData.objects.countries) as unknown as CountryGeoJsons
        return {
            countries,
            regions,
        }
    } catch (err) {
        throw err
    }
}
