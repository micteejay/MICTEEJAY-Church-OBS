#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include <obs-module.h>
#include "plugin-support.h"

const char *PLUGIN_NAME = "obs-multi-rtmp";
const char *PLUGIN_VERSION = "0.6.0.4";

void obs_log(int log_level, const char *format, ...)
{
	size_t length = 4 + strlen(PLUGIN_NAME) + strlen(format);

	char *template_str = (char *)malloc(length + 1);
	if (!template_str)
		return;

	snprintf(template_str, length + 1, "[%s] %s", PLUGIN_NAME, format);

	va_list args;
	va_start(args, format);
	blogva(log_level, template_str, args);
	va_end(args);

	free(template_str);
}

