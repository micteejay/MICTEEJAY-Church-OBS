cmake_minimum_required(VERSION 3.28...3.30)

find_package(Qt6 REQUIRED COMPONENTS Core Widgets)

add_library(obs-multi-rtmp MODULE)
add_library(OBS::obs-multi-rtmp ALIAS obs-multi-rtmp)

target_sources(obs-multi-rtmp PRIVATE
  src/pch.h
  src/obs-multi-rtmp.h
  src/obs-multi-rtmp.cpp
  src/edit-widget.h
  src/edit-widget.cpp
  src/edit-targets-dialog.h
  src/edit-targets-dialog.cpp
  src/push-widget.h
  src/push-widget.cpp
  src/json-util.hpp
  src/output-config.h
  src/output-config.cpp
  src/obs-properties-widget.h
  src/obs-properties-widget.cpp
  src/protocols.h
  src/protocols.cpp
  src/helpers.h
  src/helpers.cpp
  src/plugin-support.c
  src/plugin-support.h
)

target_include_directories(obs-multi-rtmp PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/src
  ${CMAKE_CURRENT_SOURCE_DIR}/dep/nlohmann-json
)

target_link_libraries(obs-multi-rtmp PRIVATE
  OBS::libobs
  OBS::frontend-api
  Qt::Core
  Qt::Widgets
)

set_target_properties_obs(obs-multi-rtmp
  PROPERTIES FOLDER plugins/obs-multi-rtmp
             PREFIX ""
             OUTPUT_NAME "obs-multi-rtmp"
             AUTOMOC ON
             AUTOUIC ON
)
