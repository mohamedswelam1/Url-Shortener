"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class UrlNotFoundException extends common_1.NotFoundException {
    constructor(shortCode) {
        super(`URL with short code '${shortCode}' not found`);
    }
}
exports.UrlNotFoundException = UrlNotFoundException;
//# sourceMappingURL=url-not-found.exception.js.map