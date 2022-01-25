"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAlphabets = exports.isUpperCase = exports.isLowerCase = exports.isIp = exports.isChinese = exports.isXml = exports.isData = exports.isInternetUrl = exports.isDomainName = exports.isPhoneNumer = exports.isEmail = exports.isId = void 0;
function isId(id) {
    let result = false;
    result = id.length === 15 && /^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}[0-9Xx]$/.test(id);
    result = id.length === 18 && /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(id);
    return result;
}
exports.isId = isId;
function isEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
exports.isEmail = isEmail;
function isPhoneNumer(phoneNumber) {
    let phone = String(phoneNumber);
    return /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/.test(phone);
}
exports.isPhoneNumer = isPhoneNumer;
function isDomainName(domainName) {
    return /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,6}$/.test(domainName);
}
exports.isDomainName = isDomainName;
function isInternetUrl(url) {
    let result = false;
    result = result || /^http:\/\/([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=]*)?$/.test(url);
    result = result || /[a-zA-z]+:\/\/[^\s]*/.test(url);
    return result;
}
exports.isInternetUrl = isInternetUrl;
function isData(date) {
    return /^\d{4}-\d{1,2}-\d{1,2}/.test(date);
}
exports.isData = isData;
function isXml(file) {
    return /^([a-zA-Z]+-?)+[a-zA-Z0-9]+\\.[x|X][m|M][l|L]$/.test(file);
}
exports.isXml = isXml;
function isChinese(word) {
    return /^[\u4e00-\u9fa5]+$/.test(word);
}
exports.isChinese = isChinese;
function isIp(ip) {
    return /^((?:(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d))$/.test(ip);
}
exports.isIp = isIp;
function isLowerCase(str) {
    const reg = /^[a-z]+$/;
    return reg.test(str);
}
exports.isLowerCase = isLowerCase;
function isUpperCase(str) {
    const reg = /^[A-Z]+$/;
    return reg.test(str);
}
exports.isUpperCase = isUpperCase;
function isAlphabets(str) {
    const reg = /^[A-Za-z]+$/;
    return reg.test(str);
}
exports.isAlphabets = isAlphabets;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVndWxhci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZWd1bGFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLFNBQWdCLElBQUksQ0FBQyxFQUFVO0lBQzdCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztJQUNuQixNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sS0FBSyxFQUFFLElBQUksOEVBQThFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3BILE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxLQUFLLEVBQUUsSUFBSSw4RkFBOEYsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDcEksT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDO0FBTEQsb0JBS0M7QUFLRCxTQUFnQixPQUFPLENBQUMsS0FBWTtJQUNsQyxNQUFNLEVBQUUsR0FBRyx5SkFBeUosQ0FBQztJQUNySyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUhELDBCQUdDO0FBSUQsU0FBZ0IsWUFBWSxDQUFDLFdBQTRCO0lBQ3ZELElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNoQyxPQUFPLHNFQUFzRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUMzRixDQUFDO0FBSEQsb0NBR0M7QUFFRCxTQUFnQixZQUFZLENBQUMsVUFBaUI7SUFDNUMsT0FBTyxvREFBb0QsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDOUUsQ0FBQztBQUZELG9DQUVDO0FBR0QsU0FBZ0IsYUFBYSxDQUFDLEdBQVU7SUFDdEMsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ25CLE1BQU0sR0FBRyxNQUFNLElBQUssZ0RBQWdELENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQzlFLE1BQU0sR0FBRyxNQUFNLElBQUksc0JBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ25ELE9BQU8sTUFBTSxDQUFBO0FBQ2YsQ0FBQztBQUxELHNDQUtDO0FBR0QsU0FBZ0IsTUFBTSxDQUFDLElBQVc7SUFDaEMsT0FBTyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDNUMsQ0FBQztBQUZELHdCQUVDO0FBR0QsU0FBZ0IsS0FBSyxDQUFDLElBQVc7SUFDL0IsT0FBTyxnREFBZ0QsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDcEUsQ0FBQztBQUZELHNCQUVDO0FBR0QsU0FBZ0IsU0FBUyxDQUFDLElBQVc7SUFDbkMsT0FBTyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDeEMsQ0FBQztBQUZELDhCQUVDO0FBR0QsU0FBZ0IsSUFBSSxDQUFDLEVBQVM7SUFDNUIsT0FBTyxvRkFBb0YsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDdEcsQ0FBQztBQUZELG9CQUVDO0FBR0QsU0FBZ0IsV0FBVyxDQUFDLEdBQVU7SUFDcEMsTUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDO0lBQ3ZCLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBSEQsa0NBR0M7QUFHRCxTQUFnQixXQUFXLENBQUMsR0FBVTtJQUNwQyxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUM7SUFDdkIsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUFIRCxrQ0FHQztBQUdELFNBQWdCLFdBQVcsQ0FBQyxHQUFVO0lBQ3BDLE1BQU0sR0FBRyxHQUFHLGFBQWEsQ0FBQztJQUMxQixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQUhELGtDQUdDIn0=