# Yuxi Privacy Policy

**Effective date:** 27 October 2026
**Applies to:** Yuxi: Learn Japanese (Android and iOS), version 1.0.0

Yuxi is designed to work without an account, without a server and without tracking. This
document explains what the app stores, which device features it uses, and how you can
remove your data.

## Summary

- Yuxi does not require an account or a sign-in.
- Yuxi does not contain analytics, advertising, crash-reporting or tracking SDKs.
- Yuxi does not make network requests. Learning data stays in the app's private storage
  on your device.
- You can export a backup file and import it later. Export and import happen only when
  you start them.
- You can delete everything from **Settings → Reset all data**.

## Data stored on your device

Yuxi keeps the following information in a private SQLite database named `yuxi.db`:

| Data                                                                                             | Why it is stored                           |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Language, text size, theme, daily goal, reminder time, haptics preference and onboarding state   | To restore your settings                   |
| Per-kana progress: answers, accuracy counters, ease, interval, due date and lapses               | To schedule reviews with spaced repetition |
| Review history: kana, question mode, result, quality, response time and timestamp                | To calculate accuracy and recent activity  |
| Daily statistics: XP, active seconds, questions, correct answers and goal completion             | To show progress, streaks and charts       |
| Local metadata, including a session-complete marker and the identifier of the scheduled reminder | To keep streaks and reminders consistent   |

This data is not transmitted to the developer or to any third party by Yuxi. It is
included in the app's sandbox and may be covered by the operating system's device backup
settings. Yuxi disables Android's app-data backup with `allowBackup: false`; iOS device
backup behaviour is controlled by the operating system and your iCloud settings.

## Backup export and import

When you choose **Export progress**, Yuxi creates a JSON file in its private cache and
opens the system share sheet. The file leaves the app only if you choose a destination.
When you choose **Import progress**, the system document picker gives Yuxi read access to
the file you select. Import replaces the current profile only after you confirm it.

Backup files contain settings, kana progress, daily statistics, review history and
non-device metadata. They do **not** contain the local notification identifier. Treat a
backup as personal learning data and store it somewhere you trust.

## Notifications

Yuxi can schedule one local daily reminder. The notification is created and delivered by
your device; no push server is involved. On Android, the app asks for notification
permission only when you enable the reminder, and creates a channel named
`yuxi-daily-reminder`. On iOS, the system asks for notification permission at the same
point.

The reminder body rotates between three short messages. The app stores the scheduled
notification identifier so it can cancel and replace the reminder when you change the
time, language or switch. Disabling the reminder cancels it.

## Text-to-speech

Pronunciation uses the text-to-speech engine installed on your device. Yuxi passes the
kana text to the operating system's speech API; it does not record audio and does not
send audio or text to a Yuxi server. If your device has no Japanese voice, Yuxi shows
instructions for installing one.

Some operating systems or third-party speech engines offer network-based voices. If you
select such a voice in your device settings, the speech engine may process the text
according to its own privacy policy. That behaviour is controlled by the device and the
speech engine, not by Yuxi.

## Haptics

If haptics are enabled, Yuxi asks the operating system for a light vibration when you
answer a question or tap certain controls. No sensor data is recorded.

## Permissions

| Platform feature          | When it is used                             | Permission                                                                  |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Local notifications       | Only after you enable the daily reminder    | Android 13+ / iOS notification permission                                   |
| Reminder restore          | After a device reboot, to keep the reminder | Android `RECEIVE_BOOT_COMPLETED` (normal permission)                        |
| Vibration                 | Quiz feedback when haptics are on           | Android `VIBRATE` (normal permission)                                       |
| File picker / share sheet | Only when you export or import a backup     | No broad storage permission; the system UI grants access to the chosen file |
| Text-to-speech            | When you play a kana or use Listening mode  | No runtime permission on Android or iOS                                     |

Yuxi blocks the Android advertising-ID permission (`AD_ID`) and the legacy broad storage
permissions `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`. The Android manifest
declares `INTERNET` because an Expo module adds it, but Yuxi contains no code that opens
a network connection. The app does not request camera, microphone, contacts, location or
calendar access.

## What Yuxi does not do

- No account creation, email collection or profile.
- No analytics, telemetry, crash uploads or advertising.
- No remote fonts, images or content downloads.
- No sale or sharing of personal data.
- No social features, chat or user-generated content.

## Data retention and deletion

Your data stays until you delete it. **Settings → Reset all data** performs a
double-confirmed deletion of kana progress, review history, daily statistics, settings
and local metadata, and cancels scheduled reminders. Uninstalling the app also removes
its private storage according to the operating system's rules.

Exported backup files are outside the app's control once you save or share them. Delete
them from the destination you chose if you no longer need them.

## Children

Yuxi does not require personal information and does not knowingly collect data from
children. Because the app has no accounts or network collection, there is no
child-specific data flow beyond the local learning records described above.

## Changes to this policy

If a future version adds a feature that changes these practices, this document and the
in-app privacy screen will be updated before that feature ships. The effective date at
the top of this file will change.

## Contact

Questions about privacy can be sent to **hamzapowerplayer.global@gmail.com**.
