class Resource {
    #kind;
    #path;
    #replacer;
    #loader;
    
    constructor(cfg) {
        this.#kind = cfg.kind ? cfg.kind : "local";
        this.#path = typeof(cfg) === "string" ? cfg : cfg.path;
        this.#replacer = cfg.replace;
        let fnLdr;
        switch (this.#kind) {
            case "local":
                fnLdr = loadLocal;
                break;
            case "remote":
                fnLdr = loadRemote;
                break;
            default:
                break;
        }
        this.#loader = fnLdr;
    }
    async read() {
        let sSandboxConfig = await this.#loader(this.#path);
        if (this.#replacer) {
            sSandboxConfig = sSandboxConfig.replaceAll(this.#replacer.find, this.#replacer.replace);
        };
        const oCfg = JSON.parse(sSandboxConfig);
        return oCfg;
    }
};

/**
 * Load a local resource.
 * @param {string} location 
 * @returns {Promise<string>} Character data
 */
function loadLocal(location) {
    var fs = require('fs/promises');
    var localReaderPromise = fs.readFile(location);
    return new Promise((resolve,reject)=> {
        localReaderPromise.then(localRes => resolve(localRes.toString()));
    });
};

/**
 * Load a remote resource (HTTP/HTTPS)
 * @param {string} location 
 * @returns {Promise<string>} Character data
 */
function loadRemote(location) {
    var httplib = location.startsWith("https://") ? require('https') : require('http');
    var promiseWrapper = new Promise((resolve, reject) => {
        const request = httplib.request(location,(response) => {
            let body = "";
            response.on('error', reject);
            response.on('data', (chunk) => (body += chunk));
            response.on('end', () => {
                if (response.statusCode >= 200 && response.statusCode <= 299) {
                    resolve(body);
                }
                else {
                    reject(new Error(`Failed to download ${location}, response status ${response.statusCode}`));
                }
            });
        });
        request.on('error', reject);
        request.end();
    });
    return promiseWrapper;
};

function mergeSandboxConfig(baseConfig, overlayConfig) {
    const oMerged = {...baseConfig, ...overlayConfig};
    return JSON.stringify(oMerged);
};

/**
 * FLP Sandbox Config overlay middleware.
 *
 * @param {object} parameters Parameters
 * @param {object} parameters.resources Resource collections
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.all Reader or Collection to read resources of the
 *                                        root project and its dependencies
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.rootProject Reader or Collection to read resources of
 *                                        the project the server is started in
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.dependencies Reader or Collection to read resources of
 *                                        the projects dependencies
 * @param {object} parameters.middlewareUtil Specification version dependent interface to a
 *                                        [MiddlewareUtil]{@link module:@ui5/server.middleware.MiddlewareUtil} instance
 * @param {object} parameters.options Options
 * @param {string} [parameters.options.configuration] Custom server middleware configuration if given in ui5.yaml
 * @returns {function} Middleware function to use
 */
 module.exports = function({resources, middlewareUtil, options}) {

    const baseConfig = options.configuration?.base;
    const overlayConfig = options.configuration?.overlay;

    return function (req, res, next) {
        if (!req.path.endsWith("fioriSandboxConfig.json")) {
            return next();
        }
        const oBaseResource = new Resource(baseConfig);
        const oOverlayResource = new Resource(overlayConfig);
        Promise.all([
            oBaseResource.read(),
            oOverlayResource.read()])
        .then(aConfigs => {
            const oMergedConfig = mergeSandboxConfig(aConfigs[0], aConfigs[1]);
            res.end(oMergedConfig);
        });
    };
};
