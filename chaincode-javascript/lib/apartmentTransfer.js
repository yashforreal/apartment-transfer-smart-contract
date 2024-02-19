/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class ApartmentTransfer extends Contract {

    async InitLedger(ctx) {
        const apartments = [
            {
                ID: 'apartment-001',
                Owner: 'Hari',
                Price: 1.5,
            },
            {
                ID: 'apartment-002',
                Owner: 'Shankar',
                Price: 4.3,
            },
            {
                ID: 'apartment-003',
                Owner: 'Samarth',
                Price: 1.8,
            },
            {
                ID: 'apartment-004',
                Owner: 'Paras',
                Price: 2.7,
            },
            {
                ID: 'apartment-005',
                Owner: 'Yash',
                Price: 3.6,
            },
            {
                ID: 'apartment-006',
                Owner: 'Charu',
                Price: 4.4,
            },
        ];

        for (const apartment of apartments) {
            apartment.docType = 'apartment';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(apartment.ID, Buffer.from(stringify(sortKeysRecursive(apartment))));
        }
    }

    // CreateApartment issues a new apartment to the world state with given details.
    async CreateApartment(ctx, id, owner, price) {
        const exists = await this.ApartmentExists(ctx, id);
        if (exists) {
            throw new Error(`The apartment ${id} already exists`);
        }

        const apartment = {
            ID: id,
            Owner: owner,
            Price: price,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(apartment))));
        return JSON.stringify(apartment);
    }

    // ReadApartment returns the apartment stored in the world state with given id.
    async ReadApartment(ctx, id) {
        const apartmentJSON = await ctx.stub.getState(id); // get the apartment from chaincode state
        if (!apartmentJSON || apartmentJSON.length === 0) {
            throw new Error(`The apartment ${id} does not exist`);
        }
        return apartmentJSON.toString();
    }

    // UpdateApartment updates an existing apartment in the world state with provided parameters.
    async UpdateApartment(ctx, id, owner, price) {
        const exists = await this.ApartmentExists(ctx, id);
        if (!exists) {
            throw new Error(`The apartment ${id} does not exist`);
        }

        // overwriting original apartment with new apartment
        const updatedApartment = {
            ID: id,
            Owner: owner,
            Price: price,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedApartment))));
    }

    // DeleteApartment deletes an given apartment from the world state.
    async DeleteApartment(ctx, id) {
        const exists = await this.ApartmentExists(ctx, id);
        if (!exists) {
            throw new Error(`The apartment ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // ApartmentExists returns true when apartment with given ID exists in world state.
    async ApartmentExists(ctx, id) {
        const apartmentJSON = await ctx.stub.getState(id);
        return apartmentJSON && apartmentJSON.length > 0;
    }

    // TransferApartment updates the owner field of apartment with given id in the world state.
    async TransferApartment(ctx, id, newOwner) {
        const apartmentString = await this.ReadApartment(ctx, id);
        const apartment = JSON.parse(apartmentString);
        const oldOwner = apartment.Owner;
        apartment.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(apartment))));
        return oldOwner;
    }

    // GetAllApartments returns all apartments found in the world state.
    async GetAllApartments(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all apartments in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = ApartmentTransfer;