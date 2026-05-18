import { Block, Collection, ExtendedRecordMap, NotionMap } from "notion-types";

export type CustomBlockMap =  NotionMap<CustomBlock>;
export type CustomBlock = {value:Block};
export type CustomCollectionMap = NotionMap<CustomCollection>;
export type CustomCollection = {value: Collection}

export type CustomExtendedRecordMap = ExtendedRecordMap & {
    collection: CustomCollectionMap;
    block: CustomBlockMap;

}