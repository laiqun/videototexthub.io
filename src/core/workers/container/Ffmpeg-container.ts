import { Container } from "@cloudflare/containers";

export class FfmpegContainer extends Container {
    defaultPort = 8080;
    sleepAfter = "10m";

    async onStart() {
        console.log("FFmpeg container starting...");
    }

    async onStop() {
        console.log("FFmpeg container stopping...");
    }
}