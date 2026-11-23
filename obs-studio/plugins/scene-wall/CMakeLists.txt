cmake_minimum_required(VERSION 3.28...3.30)

find_package(Qt6 REQUIRED Widgets)

add_library(scene-wall MODULE)
add_library(OBS::scene-wall ALIAS scene-wall)

target_sources(
  scene-wall
  PRIVATE
    src/plugin-main.cpp
    src/SceneWall.cpp
    src/SceneWall.h
    src/SettingsDialog.cpp
    src/SettingsDialog.h
    src/AboutDialog.h
    src/FlowLayout.h
    src/Config.h
    src/SceneContainer.h
    src/SceneTabBar.h
    src/ToggleSwitch.h
)

target_link_libraries(
  scene-wall
  PRIVATE
    OBS::libobs
    OBS::frontend-api
    Qt::Widgets
)

set_target_properties_obs(
  scene-wall
  PROPERTIES FOLDER plugins/scene-wall
             PREFIX ""
             OUTPUT_NAME "scene-wall"
             AUTOMOC ON
             AUTOUIC ON
)
