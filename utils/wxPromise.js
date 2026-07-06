function isFunction(value) {
  return typeof value === 'function';
}

function callWxApi(target, methodName, params = {}) {
  return new Promise((resolve, reject) => {
    if (!target || !isFunction(target[methodName])) {
      reject(new Error(`wx api not available: ${methodName}`));
      return;
    }

    target[methodName]({
      ...params,
      success: resolve,
      fail: reject
    });
  });
}

function toSafeResult(promise) {
  return promise
    .then((result) => ({
      ok: true,
      result
    }))
    .catch((error) => ({
      ok: false,
      error,
      errorMessage: error && error.message ? error.message : 'request failed'
    }));
}

module.exports = {
  callWxApi,
  toSafeResult
};
