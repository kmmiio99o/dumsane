import { React, ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { getTranslation } from "./translations.js";
import ItemWithRemove from "../../common/ui/ItemWithRemove.jsx";
import { findByStoreName, findByProps } from "@vendetta/metro";

const { TableRowGroup, TableSwitchRow, TableRow } = findByProps(
  "TableSwitchRow",
  "TableRowGroup",
  "TableRow",
);

let UserStore, UncachedUserManager, Profiles;

export default (props) => {
  UserStore ??= findByStoreName("UserStore");
  UncachedUserManager ??= findByProps("fetchProfile", "getUser", "setFlag");
  Profiles ??= findByProps("showUserProfile");

  async function openProfile(userId) {
    const show = Profiles.showUserProfile;
    UserStore.getUser(userId)
      ? show({ userId })
      : UncachedUserManager.getUser(userId).then(({ id }) =>
          show({ userId: id }),
        );
  }

  useProxy(storage);
  const [users, setUsers] = React.useState(storage["ignore"]["users"]);

  const handleRemoveUser = (userId) => {
    const newArr = users.filter((id) => id !== userId);
    storage["ignore"].users = newArr;
    setUsers(newArr);
  };

  const handleClearUsers = () => {
    storage["ignore"].users = [];
    setUsers([]);
  };

  let uncached = 0;

  return (
    <ReactNative.ScrollView style={{ flex: 1 }}>
      <TableRowGroup title={getTranslation("settings.titles.settings")}>
        <TableSwitchRow
          label={getTranslation("settings.showTimestamps")}
          value={storage.timestamps}
          onValueChange={(v) => (storage.timestamps = v)}
        />
        <TableSwitchRow
          label={getTranslation("settings.ewTimestampFormat")}
          value={storage.ew}
          onValueChange={(v) => (storage.ew = v)}
        />
        <TableRow
          label={getTranslation("settings.youDeletedItWarning")}
          subtitle="Messages you delete yourself won't be preserved"
        />
      </TableRowGroup>

      <TableRowGroup title={getTranslation("settings.titles.filters")}>
        <TableSwitchRow
          label={getTranslation("settings.ignoreBots")}
          value={storage.ignore.bots}
          onValueChange={(value) => (storage.ignore.bots = value)}
        />
        <TableRow
          label={getTranslation("settings.clearUsersLabel", true)?.make?.(
            users.length,
          )}
          trailing={
            <TableRow.Icon source={getAssetIDByName("ic_trash_24px")} />
          }
          onPress={() => {
            if (users.length !== 0)
              showConfirmationAlert({
                title: getTranslation("settings.confirmClear.title"),
                content: getTranslation(
                  "settings.confirmClear.description",
                  true,
                )?.make?.(users.length),
                confirmText: getTranslation("settings.confirmClear.yes"),
                cancelText: getTranslation("settings.confirmClear.no"),
                confirmColor: "brand",
                onConfirm: handleClearUsers,
              });
          }}
        />
      </TableRowGroup>

      <TableRowGroup title="Ignored Users">
        <ReactNative.View
          style={{ paddingHorizontal: 16, gap: 8, marginBottom: 16 }}
        >
          {users.map((id) => {
            const User = UserStore.getUser(id) ?? {};
            let pfp = User?.getAvatarURL?.(null, 26)?.replace?.(
              /\.(gif|webp)/,
              ".png",
            );
            if (!pfp) {
              pfp = "https://cdn.discordapp.com/embed/avatars/1.png?size=48";
              User.username = `${id} Uncached`;
              User.discriminator = "0";
              if (uncached === 0) User.username += ", press the avatar";
              uncached++;
            }

            return (
              <ItemWithRemove
                imageSource={{ uri: pfp }}
                onImagePress={() => {
                  openProfile(id);
                }}
                onRemove={() => handleRemoveUser(id)}
                label={
                  User.username +
                  (User.discriminator == 0 ? "" : `#${User.discriminator}`)
                }
                labelRemove={getTranslation("settings.removeUserButton")}
              />
            );
          })}
        </ReactNative.View>

        <TableRow
          label={getTranslation("settings.addUsersInfo")}
          subtitle="Open a user's profile and use the context menu to add them to the ignore list"
        />
      </TableRowGroup>
    </ReactNative.ScrollView>
  );
};
