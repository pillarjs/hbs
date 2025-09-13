const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';

const gen_id = function() {
    let res = '';
    for (let i=0 ; i<8 ; ++i) {
        res += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return res;
};

module.exports = function() {
    // map to store pending promises by their placeholder IDs
    const operations = new Map();

    const obj = Object.create(null);

    // register an async operation and return a placeholder ID
    obj.resolve = function resolve(fn) {
        const args = Array.prototype.slice.call(arguments, 1);
        const id = '__' + gen_id() + '__';

        const promise = new Promise(function (resolve, reject) {
            // add callback as last argument
            const callback = function (result, error) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            };

            try {
                fn.apply(null, args.concat([callback]));
            } catch (err) {
                reject(err);
            }
        });

        operations.set(id, promise);
        return id;
    };

    // wait for all operations to complete and return results mapped by ID
    obj.done = function done() {
        if (operations.size === 0) {
            return Promise.resolve({});
        }

        const entries = Array.from(operations.entries());
        const promises = entries.map(function (entry) {
            return entry[1];
        });

        return Promise.all(promises)
            .then(function (results) {
                const values = {};
                entries.forEach(function (entry, index) {
                    values[entry[0]] = results[index]; // entry[0] is the id
                });

                // clear operations after successful completion
                operations.clear();
                return values;
            })
            .catch(function (error) {
                // clear operations even on error
                operations.clear();
                throw error;
            });
    };

    // check if there are pending operations
    obj.hasPending = function hasPending() {
        return operations.size > 0;
    };

    // clear all pending operations
    obj.clear = function clear() {
        operations.clear();
    };

    return obj;
};
