.ONESHELL:
SHELL=/bin/bash
include .metadata

GS_BASE=gs://$(BUCKET_NAME)/$(SERVER_NAME)
GS_BACKUP_ZIP=$(GS_BASE)/backup-$(SERVER_NAME)-$(shell TZ=$(TIMEZONE) date '+%Y-%m-%d-%H-%M-%S').zip
GS_SOURCE_DIR=$(GS_BASE)/source
GS_SOURCE_SERVER_JAR=$(GS_SOURCE_DIR)/server.jar
GS_SOURCE_DATAPACKS_DIR=$(GS_SOURCE_DIR)/world/datapacks

SERVER_DIR=./minecraft
SERVER_JAR=$(SERVER_DIR)/server.jar
EULA=$(SERVER_DIR)/eula.txt
DATAPACKS_DIR=$(SERVER_DIR)/world/datapacks

.PHONY: startup
startup:
	@
	$(MAKE) load-server || true
	$(MAKE) start-server || true
	$(MAKE) start-agent || true

.PHONY: shutdown
shutdown:
	@
	$(MAKE) stop-server || true
	$(MAKE) stop-agent || true

.PHONY: assert-server-stopped
assert-server-stopped:
	@if $(call screen-exist,$(1)); then exit 1; fi

.PHONY: assert-server-started
assert-server-started:
	@
	if ! $(call screen-exist,$(1)); then exit 1; fi
	if ! node $(SERVER_STATUS_JS) &> /dev/null; then exit 1; fi

.PHONY: load-server
load-server: assert-server-stopped
	@
	case "$(mode)" in
		"force")
			rm -rf $(SERVER_DIR)
			;;
		*)
			if [ -e $(SERVER_DIR) ]; then exit 1; fi
			;;
	esac
	mkdir -p $(SERVER_DIR)
	if gsutil -q stat "$(GS_SOURCE_SERVER_JAR)"; then
		gsutil -m cp -r "$(GS_SOURCE_DIR)/*" "$(SERVER_DIR)/"
	else
		curl -fsSL $(SERVER_JAR_URL) > $(SERVER_JAR)
		echo -e "# $$(date '+%c (UTC%z)')\neula=true" > $(EULA)
	fi

.PHONY: load-datapacks
load-datapacks:
	@
	if gsutil -q stat "$(GS_SOURCE_DATAPACKS_DIR)"; then
		gsutil -m cp -r "$(GS_SOURCE_DATAPACKS_DIR)/*" "$(DATAPACKS_DIR)/" || true
	fi

.PHONY: backup-server
backup-server:
	@
	TEMP_ZIP=$$(mktemp -u --suffix=".zip")
	TEMP_DIR=$$(mktemp -ud)
	cp -r $(SERVER_DIR) $$TEMP_DIR
	find $$TEMP_DIR \( \
		-name "server.jar" -o -name "*.log" -o -name "*.log.gz" \
	\) -delete
	zip -r $$TEMP_ZIP $$TEMP_DIR
	gsutil cp $$TEMP_ZIP $(GS_BACKUP_ZIP)
	rm -rf $$TEMP_ZIP $$TEMP_DIR

.PHONY: update-server-source
update-server-source:
	@
	gsutil -m rm "$(GS_SOURCE_DIR)/**" || true
	gsutil -m cp -r "$(SERVER_DIR)/*" "$(GS_SOURCE_DIR)/"

.PHONY: server-command
server-command: assert-server-started
	@$(call screen-execute,minecraft,stuff "$(command)^M") || true

.PHONY: clear-log
clear-log:
	@rm -f ./make-*.log "$(SERVER_DIR)/{**/*.log.gz,**/*.log}"

#
# SCREEN
#
define screen-exist
	screen -p 0 -S make-$(1) -X stuff "" &> /dev/null
endef

define screen-execute
	if $(call screen-exist,$(1)); then \
		echo '$(2)' | xargs screen -p 0 -S make-$(1) -X; \
		true; \
	else \
		echo "No screen 'make-$(1)' found."; \
		false; \
	fi
endef

define screen-start
	if $(call screen-exist,$(1)); then \
		echo "Screen 'make-$(1)' already exists."; \
		false; \
	else \
		screen -p 0 -L -Logfile make-$(1).log -dmS make-$(1) $(MAKE) sc.$(1); \
		$(call screen-execute,$(1),colon "logfile flush 0^M"); \
		true; \
	fi
endef

.PHONY: start-server
start-server:
	@$(call screen-start,minecraft)

.PHONY: stop-server
stop-server:
	@
	$(call screen-execute,minecraft,stuff "/stop^M") || true
	$(call screen-execute,minecraft,kill) || true

.PHONY: sc.minecraft
sc.minecraft:
	@
	cd $(SERVER_DIR)
	# TODO: receive args from metadata
	java -Xmx$(JAVA_MEMORY_SIZE)G -Xms$(JAVA_MEMORY_SIZE)G -jar server.jar nogui

.PHONY: start-agent
start-agent:
	@$(call screen-start,agent)

.PHONY: stop-agent
stop-agent:
	@
	$(call screen-execute,agent,stuff "^C") || true
	$(call screen-execute,agent,kill) || true

.PHONY: sc.agent
sc.agent:
	@npm run start
