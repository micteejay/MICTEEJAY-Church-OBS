#include <obs-module.h>
#include <obs-frontend-api.h>
#include <util/config-file.h>
#include "SceneWall.h"
#include <QByteArray>
#include <QMainWindow>
#include <QPointer>

OBS_DECLARE_MODULE()
OBS_MODULE_USE_DEFAULT_LOCALE("scene-wall", "en-US")

QPointer<SceneWallWidget> sceneWall;

// OBS restores BasicWindow/DockState before plugins add their docks, so a dock
// created on FINISHED_LOADING is missing from that state and lands in the
// default area. Reapply it once the dock exists.
static void restore_dock_state()
{
    auto *window = static_cast<QMainWindow *>(obs_frontend_get_main_window());
    config_t *config = obs_frontend_get_user_config();
    if (!window || !config)
        return;

    const char *state = config_get_string(config, "BasicWindow", "DockState");
    if (state)
        window->restoreState(QByteArray::fromBase64(QByteArray(state)));
}

static void create_dock() {
    if (sceneWall)
        return; // FINISHED_LOADING can fire more than once
    sceneWall = new SceneWallWidget();
    obs_frontend_add_custom_qdock("scene-wall", sceneWall);
    restore_dock_state();
}

static void on_frontend_loaded(enum obs_frontend_event event, void *ptr)
{
    (void)ptr;
    if (event == OBS_FRONTEND_EVENT_FINISHED_LOADING)
        create_dock();
}

bool obs_module_load(void) {
    obs_frontend_add_event_callback(on_frontend_loaded, nullptr);
    return true;
}

void obs_module_unload(void) {
    obs_frontend_remove_event_callback(on_frontend_loaded, nullptr);
    if (sceneWall) {
        sceneWall->deleteLater();
    }
}
