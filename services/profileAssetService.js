const STORAGE_KEY = 'resume_profile_assets';

const ASSET_FIELDS = {
  AVATAR: 'avatar',
  WECHAT_QR: 'wechatQr'
};

function normalizeAssetPath(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function assertAssetField(field) {
  if (field !== ASSET_FIELDS.AVATAR && field !== ASSET_FIELDS.WECHAT_QR) {
    throw new Error(`unknown profile asset field: ${field}`);
  }
}

function normalizeProfileAssets(assets = {}) {
  return {
    avatar: normalizeAssetPath(assets.avatar),
    wechatQr: normalizeAssetPath(assets.wechatQr)
  };
}

function readProfileAssets(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return normalizeProfileAssets();
  }

  try {
    return normalizeProfileAssets(wxApi.getStorageSync(STORAGE_KEY));
  } catch (error) {
    return normalizeProfileAssets();
  }
}

function saveProfileAssets(wxApi, assets) {
  const normalizedAssets = normalizeProfileAssets(assets);

  if (wxApi && typeof wxApi.setStorageSync === 'function') {
    try {
      wxApi.setStorageSync(STORAGE_KEY, normalizedAssets);
    } catch (error) {
      return normalizedAssets;
    }
  }

  return normalizedAssets;
}

function saveProfileAsset(wxApi, field, assetPath) {
  assertAssetField(field);

  const assets = readProfileAssets(wxApi);
  const nextAssets = {
    ...assets,
    [field]: normalizeAssetPath(assetPath)
  };

  return saveProfileAssets(wxApi, nextAssets);
}

function clearProfileAsset(wxApi, field) {
  assertAssetField(field);

  return saveProfileAsset(wxApi, field, '');
}

function applyAssetsToProfile(profile, assets) {
  const normalizedAssets = normalizeProfileAssets(assets);
  const contact = profile.contact || {};

  return {
    ...profile,
    avatar: normalizedAssets.avatar || profile.avatar,
    contact: {
      ...contact,
      wechatQr: normalizedAssets.wechatQr || contact.wechatQr
    }
  };
}

function applyAssetsToResume(resume, assets) {
  return {
    ...resume,
    profile: applyAssetsToProfile(resume.profile, assets)
  };
}

function createAssetItem(field, title, description, assetPath) {
  return {
    field,
    title,
    description,
    assetPath,
    hasAsset: Boolean(assetPath),
    statusText: assetPath ? '已选择' : '未选择'
  };
}

function createProfileAssetState(profile, assets) {
  const normalizedAssets = normalizeProfileAssets(assets);
  const contact = profile && profile.contact ? profile.contact : {};
  const avatarPath = normalizedAssets.avatar || normalizeAssetPath(profile && profile.avatar);
  const wechatQrPath = normalizedAssets.wechatQr || normalizeAssetPath(contact.wechatQr);
  const avatar = createAssetItem(
    ASSET_FIELDS.AVATAR,
    '头像',
    '用于首页名片和打印版',
    avatarPath
  );
  const wechatQr = createAssetItem(
    ASSET_FIELDS.WECHAT_QR,
    '微信二维码',
    '用于联系区和分享海报',
    wechatQrPath
  );

  return {
    avatar,
    wechatQr,
    items: [avatar, wechatQr]
  };
}

function getChooseMediaPath(result) {
  const file = result
    && Array.isArray(result.tempFiles)
    && result.tempFiles.length
    ? result.tempFiles[0]
    : null;

  return normalizeAssetPath(file && file.tempFilePath);
}

function getChooseImagePath(result) {
  return result
    && Array.isArray(result.tempFilePaths)
    && result.tempFilePaths.length
    ? normalizeAssetPath(result.tempFilePaths[0])
    : '';
}

function chooseImageFromAlbum(wxApi) {
  return new Promise((resolve, reject) => {
    if (!wxApi) {
      reject(new Error('wx api is not available'));
      return;
    }

    if (typeof wxApi.chooseMedia === 'function') {
      wxApi.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (result) => {
          const assetPath = getChooseMediaPath(result);

          if (assetPath) {
            resolve(assetPath);
            return;
          }

          reject(new Error('no image selected'));
        },
        fail: reject
      });
      return;
    }

    if (typeof wxApi.chooseImage === 'function') {
      wxApi.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: (result) => {
          const assetPath = getChooseImagePath(result);

          if (assetPath) {
            resolve(assetPath);
            return;
          }

          reject(new Error('no image selected'));
        },
        fail: reject
      });
      return;
    }

    reject(new Error('wx image chooser is not available'));
  });
}

function persistImageFile(wxApi, tempFilePath) {
  const normalizedPath = normalizeAssetPath(tempFilePath);

  if (!normalizedPath || !wxApi || typeof wxApi.saveFile !== 'function') {
    return Promise.resolve(normalizedPath);
  }

  return new Promise((resolve) => {
    wxApi.saveFile({
      tempFilePath: normalizedPath,
      success: (result) => resolve(normalizeAssetPath(result.savedFilePath) || normalizedPath),
      fail: () => resolve(normalizedPath)
    });
  });
}

function chooseAndSaveProfileAsset(wxApi, field) {
  assertAssetField(field);

  return chooseImageFromAlbum(wxApi)
    .then((tempFilePath) => persistImageFile(wxApi, tempFilePath))
    .then((assetPath) => {
      const assets = saveProfileAsset(wxApi, field, assetPath);

      return {
        field,
        assetPath,
        assets
      };
    });
}

module.exports = {
  STORAGE_KEY,
  ASSET_FIELDS,
  normalizeProfileAssets,
  readProfileAssets,
  saveProfileAssets,
  saveProfileAsset,
  clearProfileAsset,
  applyAssetsToProfile,
  applyAssetsToResume,
  createProfileAssetState,
  chooseImageFromAlbum,
  persistImageFile,
  chooseAndSaveProfileAsset
};
