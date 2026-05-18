"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs = __importStar(require("fs"));
const axios_1 = __importStar(require("axios"));
const checks_1 = __importDefault(require("./checks/checks"));
const inputsExtractor_1 = require("./utils/inputsExtractor");
const timeFuncs_1 = require("./utils/timeFuncs");
async function validateSubscription() {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    let repoPrivate;
    if (eventPath && fs.existsSync(eventPath)) {
        const eventData = JSON.parse(fs.readFileSync(eventPath, "utf8"));
        repoPrivate = eventData?.repository?.private;
    }
    const upstream = "wechuli/allcheckspassed";
    const action = process.env.GITHUB_ACTION_REPOSITORY;
    const docsUrl = "https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions";
    core.info("");
    core.info("\u001b[1;36mStepSecurity Maintained Action\u001b[0m");
    core.info(`Secure drop-in replacement for ${upstream}`);
    if (repoPrivate === false)
        core.info("\u001b[32m✓ Free for public repositories\u001b[0m");
    core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
    core.info("");
    if (repoPrivate === false)
        return;
    const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";
    const body = { action: action || "" };
    if (serverUrl !== "https://github.com")
        body.ghes_server = serverUrl;
    try {
        await axios_1.default.post(`https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`, body, { timeout: 3000 });
    }
    catch (error) {
        if ((0, axios_1.isAxiosError)(error) && error.response?.status === 403) {
            core.error("\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m");
            core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
            process.exit(1);
        }
        core.info("Timeout or API not reachable. Continuing to next step.");
    }
}
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
    try {
        await validateSubscription();
        // delay execution
        core.info(`Validating checks, standby...`);
        await (0, timeFuncs_1.sleep)(inputsExtractor_1.sanitizedInputs.delay * 1000 * 60);
        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        const inputs = inputsExtractor_1.sanitizedInputs;
        const checks = new checks_1.default({ ...inputs, owner, repo });
        await checks.run();
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}
//# sourceMappingURL=main.js.map