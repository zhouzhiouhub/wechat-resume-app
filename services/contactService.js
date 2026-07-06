const validator = require('../utils/validator');

function normalizeContact(contact) {
  const source = contact || {};

  return {
    email: typeof source.email === 'string' ? source.email.trim() : '',
    wechatQr: typeof source.wechatQr === 'string' ? source.wechatQr.trim() : ''
  };
}

function validateContactInfo(contact) {
  const normalizedContact = normalizeContact(contact);
  const errors = [];

  if (!validator.isValidEmail(normalizedContact.email)) {
    errors.push('contact.email must be a valid email');
  }

  return {
    isValid: errors.length === 0,
    errors,
    contact: normalizedContact
  };
}

function createClipboardPayload(email) {
  if (!validator.isValidEmail(email)) {
    throw new Error('contact.email must be a valid email before copy');
  }

  return {
    data: email.trim()
  };
}

function copyEmail(wxApi, email) {
  let payload;

  try {
    payload = createClipboardPayload(email);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    if (!wxApi || typeof wxApi.setClipboardData !== 'function') {
      reject(new Error('wx.setClipboardData is not available'));
      return;
    }

    wxApi.setClipboardData({
      data: payload.data,
      success: resolve,
      fail: reject
    });
  });
}

function createPreviewPayload(wechatQr) {
  if (!validator.isNonEmptyString(wechatQr)) {
    throw new Error('contact.wechatQr must be provided before preview');
  }

  const qrPath = wechatQr.trim();

  return {
    current: qrPath,
    urls: [qrPath]
  };
}

function previewWechatQr(wxApi, wechatQr) {
  let payload;

  try {
    payload = createPreviewPayload(wechatQr);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    if (!wxApi || typeof wxApi.previewImage !== 'function') {
      reject(new Error('wx.previewImage is not available'));
      return;
    }

    wxApi.previewImage({
      current: payload.current,
      urls: payload.urls,
      success: resolve,
      fail: reject
    });
  });
}

module.exports = {
  normalizeContact,
  validateContactInfo,
  createClipboardPayload,
  copyEmail,
  createPreviewPayload,
  previewWechatQr
};
