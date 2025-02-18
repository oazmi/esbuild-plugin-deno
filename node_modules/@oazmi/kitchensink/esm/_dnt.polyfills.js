function findLastIndex(self, callbackfn, that) {
    const boundFunc = that === undefined ? callbackfn : callbackfn.bind(that);
    let index = self.length - 1;
    while (index >= 0) {
        const result = boundFunc(self[index], index, self);
        if (result) {
            return index;
        }
        index--;
    }
    return -1;
}
function findLast(self, callbackfn, that) {
    const index = self.findLastIndex(callbackfn, that);
    return index === -1 ? undefined : self[index];
}
if (!Array.prototype.findLastIndex) {
    Array.prototype.findLastIndex = function (callbackfn, that) {
        return findLastIndex(this, callbackfn, that);
    };
}
if (!Array.prototype.findLast) {
    Array.prototype.findLast = function (callbackfn, that) {
        return findLast(this, callbackfn, that);
    };
}
if (!Uint8Array.prototype.findLastIndex) {
    Uint8Array.prototype.findLastIndex = function (callbackfn, that) {
        return findLastIndex(this, callbackfn, that);
    };
}
if (!Uint8Array.prototype.findLast) {
    Uint8Array.prototype.findLast = function (callbackfn, that) {
        return findLast(this, callbackfn, that);
    };
}
export {};
