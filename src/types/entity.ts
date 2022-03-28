import { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
// data
export type RenewableEnergy = 'solar' | 'biofuels' | 'biomass' | 'hydro' | 'wind'
export const renewableEnergies: RenewableEnergy[] = ['solar', 'biofuels', 'biomass', 'hydro', 'wind', 'solar']
export type OECDStatus = 'OECD' | 'Non-OECD'
export type AreaType = 'region' | 'non-region'
export interface Data {
    code: string
    biofuels: number
    coal: number
    gas: number
    biomass: number
    hydro: number
    nuclear: number
    oil: number
    solar: number
    wind: number
    year: string
    entity: string
    oecdStatus: OECDStatus
    type: AreaType
    region: string
}
export type CountryGeoJsonFeature = Feature<
    Geometry,
    {
        name: string
    }
>
export type RegionGeoJsonFeature = Feature<
    Geometry,
    {
        region: string
    }
>
export type CountryGeoJsons = FeatureCollection<
    Geometry,
    {
        name: string
    }
>
export type RegionGeoJsons = FeatureCollection<
    Geometry,
    {
        region: string
    }
>
export interface GeoJsons {
    countries: CountryGeoJsons
    regions: RegionGeoJsons
}
