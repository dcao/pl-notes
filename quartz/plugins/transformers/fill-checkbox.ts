// This plugin turns [/] into [x], for display purposes.

import { QuartzTransformerPlugin } from "../types"

const checkboxRegex = new RegExp(/- \[\/\]/g);

export const FillCheckbox: QuartzTransformerPlugin = () => {
    return {
        name: "FillCheckbox",

        // textTransform?: (ctx: BuildCtx, src: string | Buffer) => string | Buffer
        textTransform(ctx, src) {
            if (src instanceof Buffer) {
                src = src.toString()
            }

            src = src.replace(checkboxRegex, "- [x]");

            return src;
        }
    }
}
