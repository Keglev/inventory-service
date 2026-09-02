package com.smartsupplypro.inventory.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Verifies that the deployed artifact can identify itself.
 *
 * <p>The commit is written into {@code META-INF/build-info.properties} at package
 * time and surfaced by Actuator, which is what lets a deploy check that the jar
 * answering requests is the one it just released. The value is asserted only for
 * presence: a local or CI build records {@code unknown}, and pinning the literal
 * would make this test fail for the wrong reason.</p>
 *
 * <p>Also covers the access rule: the endpoint has to be reachable without
 * authentication for the deploy to read it.</p>
 *
 * <p>A {@code @WebMvcTest} slice would not serve here — it excludes actuator
 * autoconfiguration, so the endpoint under test would not be mapped.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ActuatorBuildInfoTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void infoEndpointIsPublicAndNamesTheBuildCommit() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.build.commit").exists());
    }
}
