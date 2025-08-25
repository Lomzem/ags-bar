import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import GLib from "gi://GLib?version=2.0"
import { createBinding, createState, For, With } from "gnim"
import AstalWp from "gi://AstalWp"
import AstalBattery from "gi://AstalBattery"
import AstalNetwork from "gi://AstalNetwork"

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
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")

  const sorted = (arr: Array<AstalNetwork.AccessPoint>) => {
    return arr.filter((ap) => !!ap.ssid).sort((a, b) => b.strength - a.strength)
  }

  async function connect(ap: AstalNetwork.AccessPoint) {
    // connecting to ap is not yet supported
    // https://github.com/Aylur/astal/pull/13
    try {
      await execAsync(`nmcli d wifi connect ${ap.bssid}`)
    } catch (error) {
      // you can implement a popup asking for password here
      console.error(error)
    }
  }

  return (
    <box visible={wifi(Boolean)} orientation={Gtk.Orientation.VERTICAL}>
      <With value={wifi}>
        {(wifi) =>
          wifi && (
            <menubutton>
              <image
                iconName={createBinding(wifi, "iconName")}
                iconSize={Gtk.IconSize.LARGE}
              />
              <popover>
                <box orientation={Gtk.Orientation.VERTICAL}>
                  <For each={createBinding(wifi, "accessPoints")(sorted)}>
                    {(ap: AstalNetwork.AccessPoint) => (
                      <button onClicked={() => connect(ap)}>
                        <box spacing={4}>
                          <image iconName={createBinding(ap, "iconName")} />
                          <label label={createBinding(ap, "ssid")} />
                          <image
                            iconName="object-select-symbolic"
                            visible={createBinding(
                              wifi,
                              "activeAccessPoint",
                            )((active) => active === ap)}
                          />
                        </box>
                      </button>
                    )}
                  </For>
                </box>
              </popover>
            </menubutton>
          )
        }
      </With>
    </box>
  )
}

function DateTimeWidget() {
  const date = createPoll("", 1000 * 60, () => {
    return GLib.DateTime.new_now_local().format("%a\n%d")!
  })
  const time = createPoll("", 1000 * 60, () => {
    return GLib.DateTime.new_now_local().format("%H\n%M")!
  })

  return (
    <menubutton direction={Gtk.ArrowType.RIGHT}>
      <box orientation={Gtk.Orientation.VERTICAL}>
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
      </box>
      <popover>
        <Gtk.Calendar />
      </popover>
    </menubutton>
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
