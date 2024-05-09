const amadeus = { office_id: 'BOGZ122AR', ws_user: 'WSWPSWAN', password: 'Bj2=yu3kX5zh' };
const base64Chars = new Array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/');
const END_OF_INPUT = -1;

/* Generate Message ID */
function getMid() {
    function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); };
    function guid() { return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4(); }
    return guid();
}
/* Generate Message ID */

/* Generate Nonce */
function getNonce() {
    /* nn = randomString2(8); */
    let base64Str = '', base64Count = 0;
    function setBase64Str(str) {
        base64Str = str;
        base64Count = 0;
    }
    function readBase64() {
        if (!base64Str) return END_OF_INPUT;
        if (base64Count >= base64Str.length) return END_OF_INPUT;
        const c = base64Str.charCodeAt(base64Count) & 0xff; base64Count++;
        return c;
    }
    function encodeBase64(str) {
        setBase64Str(str);
        let result = '', done = false, lineCount = 0, inBuffer = new Array(3);
        while (!done && (inBuffer[0] = readBase64()) != END_OF_INPUT) {
            inBuffer[1] = readBase64(); inBuffer[2] = readBase64();
            result += (base64Chars[inBuffer[0] >> 2]);
            if (inBuffer[1] != END_OF_INPUT) {
                result += (base64Chars[((inBuffer[0] << 4) & 0x30) | (inBuffer[1] >> 4)]);
                if (inBuffer[2] != END_OF_INPUT) {
                    result += (base64Chars[((inBuffer[1] << 2) & 0x3c) | (inBuffer[2] >> 6)]); result += (base64Chars[inBuffer[2] & 0x3F]);
                } else {
                    result += (base64Chars[((inBuffer[1] << 2) & 0x3c)]); result += ('='); done = true;
                }
            } else {
                result += (base64Chars[((inBuffer[0] << 4) & 0x30)]); result += ('='); result += ('='); done = true;
            }
            lineCount += 4;
            if (lineCount >= 76) {
                result += ('\n'); lineCount = 0;
            }
        }
        return result;
    }
    function randomString2(len) {
        let text = ""; const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for (var i = 0; i < len; i++)text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
    /* nn = encodeBase64(randomString2(8)); */
    return encodeBase64(randomString2(8));
}
/* Generate Nonce */

/* Generate Current Time */
function getT() {
    const now = new Date();
    const month = (now.getUTCMonth() + 1) < 10 ? "0" + (now.getUTCMonth() + 1).toString() : (now.getUTCMonth() + 1);
    const date = now.getUTCDate() < 10 ? "0" + (now.getUTCDate()).toString() : now.getUTCDate();
    const hour = now.getUTCHours() < 10 ? "0" + (now.getUTCHours()).toString() : now.getUTCHours();
    const min = now.getUTCMinutes() < 10 ? "0" + (now.getUTCMinutes()).toString() : now.getUTCMinutes();
    const sec = now.getUTCSeconds() < 10 ? "0" + (now.getUTCSeconds()).toString() : now.getUTCSeconds();
    const msec = now.getMilliseconds() < 10 ? "00" + (now.getMilliseconds()).toString() : (now.getMilliseconds() < 100 ? "0" + now.getMilliseconds().toString() : now.getMilliseconds());
    return now.getUTCFullYear() + "-" + month + "-" + date + "T" + hour + ":" + min + ":" + sec + ":" + msec + "Z";
}
/* Generate Current Time */

function generateHeader() {
    const mid = getMid();
    const nonce = getNonce();
    const timestamp = getT();
    return {
        message_id: mid,
        nonce: nonce,
        timestamp: timestamp,
        digest: '',
        company: '',
        application: ''
    };
}
module.exports.generateHeader = generateHeader;