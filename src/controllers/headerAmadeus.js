const amadeus = { wsdl: '1ASIWWANWPS', office_id: 'BOGZ122AR', ws_user: 'WSWPSWAN', password: 'Bj2=yu3kX5zh', company: 'WPS', application: 'WAN' };
const base64Chars = new Array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/');
const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
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
    let base64Str = '', base64Count = 0;
    function setBase64Str(str) {
        base64Str = str; base64Count = 0;
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
        let text = ""; const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for (let i = 0; i < len; i++)text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
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

/* Generate Encrypt */
function WbsPassword(pwd, timestamp, nonceB64) {
    function rotate_left(n, s) {
        return (n << s) | (n >>> (32 - s));
    }
    function cvt_hex(val) {
        let str = "", i, v;
        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    }
    function SHA1(msg) {
        function Utf8Encode(string) {
            string = string.replace(/\r\n/g, "\n");
            let utftext = "";
            for (let n = 0; n < string.length; n++) {
                const c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192); utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224); utftext += String.fromCharCode(((c >> 6) & 63) | 128); utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        };
        const W = new Array(80);
        let temp, blockstart, i, j, A, B, C, D, E, H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;
        msg = Utf8Encode(msg);
        const msg_len = msg.length;
        let word_array = new Array();
        for (i = 0; i < msg_len - 3; i += 4) {
            j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 | msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
            word_array.push(j);
        }
        switch (msg_len % 4) {
            case 0:
                i = 0x080000000;
                break;
            case 1:
                i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
                break;
            case 2:
                i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
                break;
            case 3:
                i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
                break;
        }
        word_array.push(i);
        while ((word_array.length % 16) != 14) word_array.push(0);
        word_array.push(msg_len >>> 29);
        word_array.push((msg_len << 3) & 0x0ffffffff);
        for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
            for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
            for (i = 16; i <= 79; i++) W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
            A = H0; B = H1; C = H2; D = H3; E = H4;
            for (i = 0; i <= 19; i++) {
                temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            for (i = 20; i <= 39; i++) {
                temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            for (i = 40; i <= 59; i++) {
                temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            for (i = 60; i <= 79; i++) {
                temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            H0 = (H0 + A) & 0x0ffffffff; H1 = (H1 + B) & 0x0ffffffff; H2 = (H2 + C) & 0x0ffffffff; H3 = (H3 + D) & 0x0ffffffff; H4 = (H4 + E) & 0x0ffffffff;
        }
        const temp1 = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
        return temp1.toUpperCase();
    }
    function parseHexaBytes(iText) {
        let aResult = [];
        for (var i = 0; i < iText.length; i = i + 2) {
            const aValue = parseInt(iText.substr(i, 2), 16);
            if (aValue > 255) false /* alert('Too large!'); */
            if (aValue == 0) false /* alert('Null value!'); */
            aResult.push(aValue);
        }
        return aResult;
    }
    function decode64Bytes(input) {
        let output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output.push(chr1);
            if (enc3 != 64) {
                output.push(chr2);
            }
            if (enc4 != 64) {
                output.push(chr3);
            }
        }
        return output;
    }
    function stringToArray(iText) {
        let aResult = [];
        for (let i = 0; i < iText.length; i = i + 1) {
            aResult.push(iText.charCodeAt(i));
        }
        return aResult;
    }
    function SHA1Bytes(msg) {
        let blockstart, i, j, A, B, C, D, E, temp, H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;
        let W = new Array(80), word_array = new Array();
        const msg_len = msg.length;
        for (i = 0; i < msg_len - 3; i += 4) {
            if (msg[i] > 255 || msg[i + 1] > 255 || msg[i + 2] > 255 || msg[i + 3] > 255) false /* alert('Not a byte!'); */
            j = msg[i] << 24 | msg[i + 1] << 16 | msg[i + 2] << 8 | msg[i + 3];
            word_array.push(j);
        }
        switch (msg_len % 4) {
            case 0: i = 0x080000000;
                break;
            case 1: i = msg[msg_len - 1] << 24 | 0x0800000;
                break;
            case 2: i = msg[msg_len - 2] << 24 | msg[msg_len - 1] << 16 | 0x08000;
                break;
            case 3: i = msg[msg_len - 3] << 24 | msg[msg_len - 2] << 16 | msg[msg_len - 1] << 8 | 0x80;
                break;
        }
        word_array.push(i);
        while ((word_array.length % 16) != 14) word_array.push(0);
        word_array.push(msg_len >>> 29);
        word_array.push((msg_len << 3) & 0x0ffffffff);
        for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
            for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
            for (i = 16; i <= 79; i++) W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
            A = H0; B = H1; C = H2; D = H3; E = H4;
            for (i = 0; i <= 19; i++) {
                temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            for (i = 20; i <= 39; i++) {
                temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            for (i = 40; i <= 59; i++) {
                temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            for (i = 60; i <= 79; i++) {
                temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                E = D; D = C; C = rotate_left(B, 30); B = A; A = temp;
            }
            H0 = (H0 + A) & 0x0ffffffff; H1 = (H1 + B) & 0x0ffffffff; H2 = (H2 + C) & 0x0ffffffff; H3 = (H3 + D) & 0x0ffffffff; H4 = (H4 + E) & 0x0ffffffff;
        }
        const temp1 = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
        return temp1.toUpperCase();
    }
    function encode64Bytes(input) {
        let output = '', chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
        while (i < input.length) {
            chr1 = input[i++]; chr2 = input[i++]; chr3 = input[i++]; enc1 = chr1 >> 2; enc2 = ((chr1 & 3) << 4) | (chr2 >> 4); enc3 = ((chr2 & 15) << 2) | (chr3 >> 6); enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
    }
    const aPwd = parseHexaBytes(SHA1(pwd));
    const aNonce = decode64Bytes(nonceB64);
    const aTime = stringToArray(timestamp);
    const aHash = SHA1Bytes(aNonce.concat(aTime.concat(aPwd)));
    const HshPwd = encode64Bytes(parseHexaBytes(aHash));
    return HshPwd;
}
/* Generate Encrypt */

function generateHeader(data, type) {
    /* no sataeful o start */
    const mid = getMid(), nonce = getNonce(), timestamp = getT();
    const digest = WbsPassword(amadeus.password, timestamp, nonce);
    const lastLine = type == 0 ? '' : '<awsse:Session TransactionStatusCode="Start" xmlns:awsse="http://xml.amadeus.com/2010/06/Session_v3"/>';
    return `<soapenv:Header><add:MessageID xmlns:add=\"http://www.w3.org/2005/08/addressing\">${mid}</add:MessageID><add:Action xmlns:add=\"http://www.w3.org/2005/08/addressing\">http://webservices.amadeus.com/${data}</add:Action><add:To xmlns:add=\"http://www.w3.org/2005/08/addressing\">https://nodeD1.test.webservices.amadeus.com/${amadeus.wsdl}</add:To><link:TransactionFlowLink xmlns:link=\"http://wsdl.amadeus.com/2010/06/ws/Link_v1\"/><oas:Security xmlns:oas=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\"><oas:UsernameToken oas1:Id=\"UsernameToken-1\" xmlns:oas1=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\"><oas:Username>${amadeus.ws_user}</oas:Username><oas:Nonce EncodingType=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary\">${nonce}</oas:Nonce><oas:Password Type=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest\">${digest}</oas:Password><oas1:Created>${timestamp}</oas1:Created></oas:UsernameToken></oas:Security><AMA_SecurityHostedUser xmlns=\"http://xml.amadeus.com/2010/06/Security_v1\"><UserID AgentDutyCode=\"SU\" RequestorType=\"U\" PseudoCityCode=\"${amadeus.office_id}\" POS_Type=\"1\"/></AMA_SecurityHostedUser>${lastLine}</soapenv:Header>`;;
}
module.exports.generateHeader = generateHeader;
function generateHeaderStateful(data, type, session) {
    const lastLine = type == 2 ? 'InSeries' : 'End';
    /* in session o end */
    return `<soapenv:Header>
    <add:MessageID xmlns:add="http://www.w3.org/2005/08/addressing">00ffa81b-7176-b9d5-898b-9bc51050faab</add:MessageID>
    <add:Action xmlns:add="http://www.w3.org/2005/08/addressing">http://webservices.amadeus.com/TIPNRQ_23_1_1A</add:Action>
    <add:To xmlns:add="http://www.w3.org/2005/08/addressing">https://nodeD1.test.webservices.amadeus.com/1ASIWWANWPS</add:To>
	<awsse:Session TransactionStatusCode="${lastLine}" xmlns:awsse="http://xml.amadeus.com/2010/06/Session_v3">
		<awsse:SessionId>002OA2OCV3</awsse:SessionId>
		<awsse:SequenceNumber>2</awsse:SequenceNumber>
		<awsse:SecurityToken>2U442Q5ILXUK6QQBAWDANYRVZ</awsse:SecurityToken>
	</awsse:Session>
    ${data}
</soapenv:Header>`;
}
module.exports.generateHeaderStateful = generateHeaderStateful;