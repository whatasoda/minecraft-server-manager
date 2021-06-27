SHELL=/bin/bash
# supposed to be placed at default workdir of startup-script

MINECRAFT=minecraft
GCS_BASE="gs://$(BUCKET_NAME)/$(SERVER_NAME)"

define screen-exist
	result=0; screen -p 0 -S make-$(1) -X stuff "" > /dev/null || result=$$?;
endef

define screen-start
	$(call screen-exist,$(1)) \
	if [ "$$result" == "0" ]; then \
		echo "Screen 'make-$(1)' already exists."; \
		result=1; \
	else \
		screen -p 0 -L -Logfile make-$(1).log -dmS make-$(1) $(MAKE) sc.$(1); \
		result=0; \
	fi
endef

define screen-execute
	$(call screen-exist,$(1)) \
	if [ "$$result" == "0" ]; then \
		echo '$(2)' | xargs screen -p 0 -S make-$(1) -X; \
		result=0; \
	else \
		echo "No screen 'make-$(1)' found."; \
		result=1; \
	fi
endef

.PHONY: startup
startup:
	@$(MAKE) download-server-jar || true
	@$(MAKE) start-minecraft || true
	@$(MAKE) start-agent || true

.PHONY: shutdown
shutdown:
	@$(MAKE) stop-minecraft || true
	@$(MAKE) kill-agent || true

.PHONY: download-server-jar
download-server-jar:
	@\
		if [ ! -e ./$(MINECRAFT)/server.jar ]; then \
			printf 'No server.jar found, downloading...'; \
			mkdir ./$(MINECRAFT); \
			curl -fsSL https://launchermeta.mojang.com/mc/game/version_manifest.json | \
				jq '.versions[0].url' | \
				xargs curl -fsSL | \
				jq '.downloads.server.url' | \
				xargs curl -fsSL > ./$(MINECRAFT)/server.jar; \
			printf 'done\n'; \
		fi

.PHONY: sc.minecraft
sc.minecraft:
	@\
		cd ./$(MINECRAFT) && \
		echo "#$(shell date '+%c (UTC%z)')" > eula.txt; \
		echo "eula=true" >> eula.txt; \
		java -Xmx$(JAVA_MEMORY_SIZE)G -Xms$(JAVA_MEMORY_SIZE)G -jar server.jar nogui

.PHONY: start-minecraft
start-minecraft:
	@echo 'Starting minecraft server...'
	@$(call screen-start,minecraft)
	@$(call screen-execute,minecraft,colon "logfile flush 0^M")
	@echo 'Successfully started minecraft server!'

.PHONY: kill-minecraft
kill-minecraft:
	@echo 'Killing minecraft server...'
	@$(call screen-execute,minecraft,kill)
	@echo 'Successfully killed minecraft server!'

.PHONY: log-minecraft
log-minecraft:
	@tail -Fn 10 make-minecraft.log

.PHONY: exec-command-minecraft
exec-command-minecraft:
	@$(call screen-execute,minecraft,stuff "$(command)^M")

.PHONY: load-minecraft-data
load-minecraft-data:
	@echo 'Loading minecraft server data...'
	@\
		result=0; gsutil -q stat $(GCS_BASE)/$(MINECRAFT)/server.jar || result=$$?; \
		if [ "$$result" == "0" ]; then \
			echo 'Loading from GCS'; \
			rm -rf ./$(MINECRAFT); \
			gsutil cp -r "$(GCS_BASE)/$(MINECRAFT)" .; \
		fi
	@echo 'Successfully loaded minecraft server data!'

.PHONY: save-minecraft-data
save-minecraft-data:
	@echo 'Saving minecraft server data...'
	@rm -rf /tmp/$(MINECRAFT)
	@cp -r ./$(MINECRAFT) /tmp/$(MINECRAFT)
	@rm -f /tmp/$(MINECRAFT)/server.jar
	@rm -f /tmp/$(MINECRAFT)/*.log.gz
	@zip -r /tmp/$(MINECRAFT).zip /tmp/$(MINECRAFT)
	@gsutil cp /tmp/$(MINECRAFT).zip "$(GCS_BASE)/$(MINECRAFT)-$(shell TZ=UTC-9 date '+%Y-%m-%d-%H-%M-%S').zip"
	@rm -rf /tmp/$(MINECRAFT) /tmp/$(MINECRAFT).zip
	@echo 'Successfully saved minecraft server data!'

.PHONY: stop-minecraft
stop-minecraft:
	@echo 'Stopping minecraft server...'
	@$(call screen-execute,minecraft,stuff "/stop^M")
	@$(call screen-execute,minecraft,kill)
	@gsutil -m rm "$(GCS_BASE)/$(MINECRAFT)/**" || true
	@gsutil -m cp -r "./$(MINECRAFT)/*" "$(GCS_BASE)/$(MINECRAFT)"
	@echo 'Successfully stopped minecraft server!'

.PHONY: sc.agent
sc.agent:
	@\
		if [ ! -e repo/src/node_modules ]; then \
			node repo/scripts/build-package-json.js; \
			mv repo/dist/mcs-workdir/* ./; \
			NODE_ENV=production npm ci; \
		fi
	@NODE_ENV=production npm run start

.PHONY: start-agent
start-agent:
	@echo 'Starting agent server...'
	@$(call screen-start,agent)
	@$(call screen-execute,agent,colon "logfile flush 5^M")
	@echo 'Successfully started agent server!'

.PHONY: kill-agent
kill-agent:
	@echo 'Killing agent server...'
	@$(call screen-execute,agent,kill)
	@echo 'Successfully killed agent server!'

.PHONY: log-agent
log-agent:
	@tail -Fn 10 make-agent.log

.PHONY: clear-log
clear-log:
	@rm ./make-*.log
	@rm ./$(MINECRAFT)/*.log.gz
