const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const forge = require('node-forge');

module.exports.decryptRSAPrivate = function(pemPrivateKey, encryptedData) {
    try {
        // 1. PEM 문자열을 Forge 키 객체로 변환
        const privateKey = forge.pki.privateKeyFromPem(pemPrivateKey);

        // 2. Base64로 온 데이터를 바이너리 바이트로 변환
        const encryptedBytes = forge.util.decode64(encryptedData);

        // 3. 복호화 실행 (LearningX 규격인 RSAES-PKCS1-V1_5 명시)
        const decrypted = privateKey.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5');

        // 4. 결과물을 UTF-8 문자열로 변환하여 반환
        return forge.util.decodeUtf8(decrypted);
    } catch (error) {
        // 데이터가 깨졌거나 키가 맞지 않을 경우 에러 처리
        console.error("복호화 중 오류 발생:", error.message);
        return null;
    }
};