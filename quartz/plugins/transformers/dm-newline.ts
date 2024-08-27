// Turns $$ xyz $$ into $$\nxyz\n$$.

import { QuartzTransformerPlugin } from "../types"

const dollarsRegex = new RegExp(/\s?\$\$\s?/g);

export const DisplayMathNewline: QuartzTransformerPlugin = () => {
    return {
        name: "DisplayMathNewline",

        // textTransform?: (ctx: BuildCtx, src: string | Buffer) => string | Buffer
        textTransform(ctx, src) {
            if (src instanceof Buffer) {
                src = src.toString()
            }

            src = src.replace(dollarsRegex, "\n$$$$\n");

            return src;
        }
    }
}
