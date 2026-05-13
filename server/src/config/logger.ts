import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
      : undefined,
});

// Redirect console.log/error through pino so all existing calls get structured output
console.log = (...args: any[]) => logger.info(args.length === 1 ? args[0] : args.join(" "));
console.error = (...args: any[]) => logger.error(args.length === 1 ? args[0] : args.join(" "));
console.warn = (...args: any[]) => logger.warn(args.length === 1 ? args[0] : args.join(" "));

export default logger;
