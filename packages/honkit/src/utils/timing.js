const Immutable = require("immutable");
const is = require("is");

const timers = {};
const startDate = Date.now();

/**
    Mesure an operation

    @parqm {String} type
    @param {Promise} p
    @return {Promise}
*/
function measure(type, p) {
    timers[type] = timers[type] || {
        type: type,
        count: 0,
        total: 0,
        min: undefined,
        max: 0,
    };

    const start = Date.now();

    return p.fin(() => {
        const end = Date.now();
        const duration = end - start;

        timers[type].count++;
        timers[type].total += duration;

        if (is.undefined(timers[type].min)) {
            timers[type].min = duration;
        } else {
            timers[type].min = Math.min(timers[type].min, duration);
        }

        timers[type].max = Math.max(timers[type].max, duration);
    });
}

/**
    Return a milliseconds number as a second string

    @param {Number} ms
    @return {String}
*/
function time(ms) {
    if (ms < 1000) {
        return `${ms.toFixed(0)}ms`;
    }

    return `${(ms / 1000).toFixed(2)}s`;
}

/**
    Dump all timers to a logger

    @param {Logger} logger
*/
function dump(logger) {
    const prefix = "    > ";
    let measured = 0;
    const totalDuration = Date.now() - startDate;

    // Enable debug logging
    const logLevel = logger.getLevel();
    logger.setLevel("debug");

    Immutable.Map(timers)
        .valueSeq()
        .sortBy((timer) => {
            measured += timer.total;
            return timer.total;
        })
        .forEach((timer) => {
            const percent = (timer.total * 100) / totalDuration;

            logger.debug.ln(`${percent.toFixed(1)}% of time spent in "${timer.type}" (${timer.count} times) :`);
            logger.debug.ln(`${prefix}Total: ${time(timer.total)} | Average: ${time(timer.total / timer.count)}`);
            logger.debug.ln(`${prefix}Min: ${time(timer.min)} | Max: ${time(timer.max)}`);
            logger.debug.ln("---------------------------");
        });

    logger.debug.ln(`${time(totalDuration - measured)} spent in non-mesured sections`);

    // Rollback to previous level
    logger.setLevel(logLevel);
}

module.exports = {
    measure: measure,
    dump: dump,
};
