package com.smartsupplypro.inventory.testsupport;

import java.util.List;

import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

/**
 * Captures what one class logs, for tests that assert on log content.
 *
 * <p>logback-test.xml keeps the root at WARN, so the logger's level is set
 * explicitly, and additivity is switched off so captured lines stay out of
 * the console. {@link #close()} restores both.</p>
 */
public final class LogCapture implements AutoCloseable {

    private final Logger logger;
    private final Level previousLevel;
    private final boolean previousAdditive;
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    private LogCapture(Class<?> type, Level level) {
        logger = (Logger) LoggerFactory.getLogger(type);
        previousLevel = logger.getLevel();
        previousAdditive = logger.isAdditive();
        logger.setLevel(level);
        logger.setAdditive(false);
        appender.start();
        logger.addAppender(appender);
    }

    /**
     * Starts capturing.
     *
     * @param type  class whose logger is captured
     * @param level lowest level captured
     * @return the running capture; close it to restore the logger
     */
    public static LogCapture of(Class<?> type, Level level) {
        return new LogCapture(type, level);
    }

    /** @return the captured events, in order */
    public List<ILoggingEvent> events() {
        return List.copyOf(appender.list);
    }

    /** @return the formatted messages of the captured events, in order */
    public List<String> messages() {
        return appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
    }

    @Override
    public void close() {
        logger.detachAppender(appender);
        appender.stop();
        logger.setLevel(previousLevel);
        logger.setAdditive(previousAdditive);
    }
}
