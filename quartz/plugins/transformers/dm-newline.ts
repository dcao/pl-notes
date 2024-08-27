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

            let lines = src.split(/\r?\n|\r|\n/g);
            let res = "";

            for (const line of lines) {
                let item = "";

                if (line.startsWith(">")) {
                    item = line.replace(dollarsRegex, "\n> $$$$\n> ");
                } else {
                    item = line.replace(dollarsRegex, "\n$$$$\n");
                }

                res = `${res}\n${item}`;
            }

            return res;
        }
    }
}
