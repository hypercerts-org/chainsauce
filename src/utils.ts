import {fetchFromHTTPS, fetchFromIPFS} from "@/fetching";

export function encodeJsonWithBigInts(value: unknown): string {
    const obj = {};

    // assert value is an object and can be iterated
    if (value === undefined || value === null) {
        return JSON.stringify(value);
    }

    for (const [key, _value] of Object.entries(value)) {
        // Convert numbers outside the safe range and BigInts to a string representation
        if (typeof _value === "number" || typeof _value === "bigint") {
            Object.assign(obj, {[key]: {type: "bigint", value: BigInt(_value).toString()}})
            continue;
        }

        // Recursively handle arrays
        if (Array.isArray(_value)) {
            const parsedArray = _value.map(item => {
                if (typeof item === "number" || typeof item === "bigint") {
                    return {type: "bigint", value: BigInt(item).toString()};
                }
                return item;
            });

            Object.assign(obj, {[key]: parsedArray})
            continue;
        }

        Object.assign(obj, {[key]: _value})
    }

    return JSON.stringify(obj);
}

export function decodeJsonWithBigInts<T>(encodedJson: string): T {
    const obj = JSON.parse(encodedJson);
    const decoded = {}

    for (const [key, _value] of Object.entries(obj)) {
        if (typeof _value === "object" && _value !== null && "type" in _value && _value.type === "bigint" && "value" in _value && typeof _value.value === "string") {
            Object.assign(decoded, {[key]: BigInt(_value.value)});
            continue;
        }

        if (typeof _value === "object" && _value !== null && Array.isArray(_value)) {
            const parsedArray = _value.map(item => {
                if (typeof item === "object" && item !== null && "type" in item && item.type === "bigint" && "value" in item && typeof item.value === "string") {
                    return BigInt(item.value);
                }
                return item;
            });

            Object.assign(decoded, {[key]: parsedArray})
            continue;
        }

        Object.assign(decoded, {[key]: _value})
    }

    return decoded as T;
}

const DO_NOT_PARSE = ["ipfs://null", "ipfs://", "ipfs://example"];

export const fetchFromHttpsOrIpfs = async (uri?: string): Promise<unknown> => {
    if (!uri || DO_NOT_PARSE.includes(uri)) {
        return;
    }

    let fetchResult;

    // Try from IPFS
    if (uri.startsWith("ipfs://")) {
        fetchResult = await fetchFromIPFS({ uri });
    }

    // Try from HTTPS
    if (uri.startsWith("https://")) {
        fetchResult = await fetchFromHTTPS({ uri });
    }

    // If nothing found yet, try from IPFS as CID
    if (!fetchResult) {
        fetchResult = await fetchFromIPFS({ uri });
    }

    return fetchResult;
};
