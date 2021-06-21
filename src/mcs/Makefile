SHELL=/bin/bash
# supposed to be placed at default workdir of startup-script

SERVER_NAME=# compute engine instance name
BUCKET_NAME=# bucket name to use for data of server
JAVA_MEM_SIZE=2# memory size of java process
GIT_TAG=main

####_VARIABLE_DEFINITION_####

MINECRAFT=minecraft
GCS_BASE="gs://$(BUCKET_NAME)/$(SERVER_NAME)"

define screen-exist
	result=0; screen -p 0 -S make-$(1) -X stuff "" > /dev/null || result=$$?;
endef

define screen-start
	$(call screen-exist,$(1)) \
	if [ "$$result" == "0" ]; then \
		echo "Screen 'make-$(1)' already exists."; exit 1; \
	else \
		screen -p 0 -L -Logfile make-$(1).log -dmS make-$(1) $(MAKE) sc.$(1); \
	fi
endef

define screen-execute
	$(call screen-exist,$(1)) \
	if [ "$$result" == "0" ]; then \
		echo '$(2)' | xargs screen -p 0 -S make-$(1) -X; \
	else \
		echo "No screen 'make-$(1)' found."; exit 1; \
	fi
endef

startup:
	@# NOTE: `sudo apt update` will be executed by startup script
	@curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
	@sudo apt-get install -y openjdk-16-jdk-headless zip screen jq nodejs
	@sudo apt-get clean
	@$(MAKE) download-repo
	@$(MAKE) load-minecraft-data
	@$(MAKE) start-minecraft
	@$(MAKE) start-agent

shutdown:
	@$(MAKE) stop-minecraft
	@$(MAKE) kill-agent

download-repo:
	@echo "Downloading repo..."
	@rm -rf ./repo
	@curl -fsSL https://github.com/whatasoda/minecraft-server-manager/archive/refs/heads/$(GIT_TAG).zip > /tmp/repo.zip
	@unzip /tmp/repo.zip -d /tmp/repo
	@mv /tmp/repo/* ./repo
	@rm /tmp/repo.zip
	@echo "Successfully downloaded repo!"

load-minecraft-data:
	@echo 'Loading minecraft server data...'
	@rm -rf ./$(MINECRAFT)
	@ \
		result=0; gsutil -q stat $(GCS_BASE)/$(MINECRAFT)/server.jar || result=$$?; \
		if [ "$$result" == "0" ]; then \
			echo 'Loading from GCS'; \
			gsutil cp -r $(GCS_BASE)/$(MINECRAFT) .; \
		else \
			echo 'No data found in GCS, Downloading latest server.jar'; \
			mkdir ./$(MINECRAFT); \
			curl -fsSL https://launchermeta.mojang.com/mc/game/version_manifest.json | \
			jq '.versions[0].url' | \
			xargs curl -fsSL | \
			jq '.downloads.server.url' | \
			xargs curl -fsSL > ./$(MINECRAFT)/server.jar; \
		fi
	@echo 'Successfully loaded minecraft server data!'

sc.minecraft:
	@ \
		cd ./$(MINECRAFT) && \
		echo "#$(shell date '+%c (UTC%z)')\neula=true" > eula.txt; \
		java -Xmx$(JAVA_MEM_SIZE)G -Xms$(JAVA_MEM_SIZE)G -jar server.jar nogui

start-minecraft:
	@echo 'Starting minecraft server...'
	@$(call screen-start,minecraft)
	@$(call screen-execute,minecraft,colon "logfile flush 0^M")
	@echo 'Successfully started minecraft server!'

kill-minecraft:
	@echo 'Killing minecraft server...'
	@$(call screen-execute,minecraft,kill)
	@echo 'Successfully killed minecraft server!'

log-minecraft:
	@tail -Fn 10 make-minecraft.log

exec-command-minecraft:
	@$(call screen-execute,minecraft,stuff "$(command)^M")

save-minecraft-data:
	@echo 'Saving minecraft server data...'
	@cp -r ./$(MINECRAFT) /tmp/$(MINECRAFT)
	@rm /tmp/$(MINECRAFT)/server.jar
	@zip -r /tmp/$(MINECRAFT).zip /tmp/$(MINECRAFT)
	@gsutil cp /tmp/$(MINECRAFT).zip $(GCS_BASE)/$(MINECRAFT)-$(shell TZ=UTC-9 date '+%Y-%m-%d-%H-%M-%S').zip
	@rm -rf /tmp/$(MINECRAFT) /tmp/$(MINECRAFT).zip
	@echo 'Successfully saved minecraft server data!'

stop-minecraft:
	@$(MAKE) save-minecraft-data
	@echo 'Stopping minecraft server...'
	@$(call screen-execute,minecraft,stuff "/stop^M")
	@$(call screen-execute,minecraft,kill) || true
	@gsutil rm $(GCS_BASE)/$(MINECRAFT)/**
	@gsutil cp -r ./$(MINECRAFT)/** $(GCS_BASE)/$(MINECRAFT)
	@echo 'Successfully stopped minecraft server!'

sc.agent:
	@node repo/scripts/build-package-json.js
	@NODE_ENV=production npm ci --prefix repo/src/mcs
	@NODE_ENV=production npm run start --prefix repo/src/mcs

start-agent:
	@echo 'Starting agent server...'
	@$(call screen-start,agent)
	@$(call screen-execute,agent,colon "logfile flush 5^M")
	@echo 'Successfully started agent server!'

kill-agent:
	@echo 'Killing agent server...'
	@$(call screen-execute,agent,kill)
	@echo 'Successfully killed agent server!'

log-agent:
	@tail -Fn 10 make-agent.log
