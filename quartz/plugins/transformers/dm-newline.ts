// Turns $$ xyz $$ into $$\nxyz\n$$.

import { QuartzTransformerPlugin } from "../types"

const dollarsRegex = new RegExp(/(.+)(\$\$)(.+)/g);

export const DisplayMathNewline: QuartzTransformerPlugin = () => {
    return {
        name: "DisplayMathNewline",

        // textTransform?: (ctx: BuildCtx, src: string | Buffer) => string | Buffer
        textTransform(ctx, src) {
            if (src instanceof Buffer) {
                src = src.toString()
            }

            src = src.replace(dollarsRegex, "$1\n$2\n$3");

            return src;
        }
    }
}
