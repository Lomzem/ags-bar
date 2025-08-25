import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import GLib from "gi://GLib?version=2.0"
import { createBinding, createState } from "gnim"
import AstalWp from "gi://AstalWp"
import AstalBattery from "gi://AstalBattery"

function BatteryWidget() {
  const battery = AstalBattery.get_default()

  const percent = createBinding(
    battery,
    "percentage",
  )((p) => `${Math.floor(p * 100)}%`)

  return (
    <menubutton visible={createBinding(battery, "isPresent")}>
      <box class="battery-box blue">
        <label label={percent} />
        <image iconName={createBinding(battery, "iconName")} />
      </box>
    </menubutton>
  )
}

function VolumeWidget() {
  const [childRevealed, setChildRevealed] = createState(false)
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <menubutton
      direction={Gtk.ArrowType.RIGHT}
      onNotifyActive={() => {
        setChildRevealed(!childRevealed.get())
        print("clicked")
      }}
    >
      <box class="volume-box magenta">
        <label
          class="font-large"
          justify={Gtk.Justification.CENTER}
          label={createBinding(speaker, "volume").as((v) =>
            Math.round(v * 100).toString(),
          )}
        />
        <Gtk.Image
          iconName="audio-volume-high-symbolic"
          iconSize={Gtk.IconSize.NORMAL}
          cssName="volume magenta"
        />
      </box>
      <popover>
        <revealer
          revealChild={childRevealed}
          transitionType={Gtk.RevealerTransitionType.SLIDE_RIGHT}
          transitionDuration={300}
        >
          <slider
            $type="overlay"
            widthRequest={200}
            min={0}
            max={1}
            onChangeValue={({ value }) => speaker.set_volume(value)}
            value={createBinding(speaker, "volume")}
          />
        </revealer>
      </popover>
    </menubutton>
  )
}

function NetworkWidget() {
  const networkStateIcon = createPoll(
    "",
    1000 * 5,
    ["nmcli", "--fields", "STATE", "device", "status"],
    (stdout: string, _) => {
      const status = stdout.split("\n")[1].trim()
      if (status === "connected") {
        return "network-wireless-signal-excellent-symbolic"
      } else {
        return "network-wireless-offline-symbolic"
      }
    },
  )
  return <Gtk.Image iconName={networkStateIcon} iconSize={Gtk.IconSize.LARGE} />
}

function DateTimeWidget() {
  const date = createPoll("", 1000 * 60, () => {
    return GLib.DateTime.new_now_local().format("%a\n%d")!
  })
  const time = createPoll("", 1000 * 60, () => {
    return GLib.DateTime.new_now_local().format("%H\n%M")!
  })

  return (
    <>
      <label
        class="datetime yellow"
        label={date}
        justify={Gtk.Justification.CENTER}
      />
      <Gtk.Separator class="separator" />
      <label
        class="datetime green"
        label={time}
        justify={Gtk.Justification.CENTER}
      />
    </>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, BOTTOM } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | BOTTOM}
      application={app}
    >
      <centerbox cssName="centerbox" orientation={Gtk.Orientation.VERTICAL}>
        <box $type="end" orientation={Gtk.Orientation.VERTICAL}>
          <BatteryWidget />
          <Gtk.Separator class="separator" />
          <VolumeWidget />
          <Gtk.Separator class="separator" />
          <NetworkWidget />
          <Gtk.Separator class="separator" />
          <DateTimeWidget />
        </box>
      </centerbox>
    </window>
  )
}
